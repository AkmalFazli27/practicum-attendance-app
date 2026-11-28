import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Search,
  Upload,
  UserCheck,
} from 'lucide-react-native';

import {
  DropdownSelect,
  type DropdownOption,
} from '@/components/aslab/lab/AslabUi';
import {
  ImportReviewList,
  type FieldDefinisiReview,
  type ItemReviewTampil,
} from '@/components/aslab/lab/ImportReviewList';
import {
  DAFTAR_HARI_EN,
  DAFTAR_HARI_ID,
  HARI_AKTIF_KAMPUS,
  hariIniYmd,
  hitungTanggalPertemuanRutin,
  useAslabStore,
  type IndeksHari,
} from '@/components/aslab/lab/aslabStore';
import {
  HEADER_CSV,
  pilihDanBacaCsv,
  unduhTemplateCsv,
} from '@/components/aslab/lab/csvLab';
import { useLabI18n } from '@/components/aslab/lab/i18nLab';
import {
  evaluasiBarisAnggota,
  type BarisReviewAnggota,
} from '@/components/aslab/lab/validasiManajemenLab';
import { Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Lab, User } from '@/data/dummy';
import {
  fontFamily,
  layout,
  radius,
  spacing,
  type as tipe,
  type ThemeColors,
} from '@/theme/tokens';

const CUSTOM_MK_VALUE = '__CUSTOM_MK__';
const PESERTA_PER_HALAMAN = 5;
const RE_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;
const RE_YMD = /^\d{4}-\d{2}-\d{2}$/;

type Langkah = 1 | 2 | 3 | 4;
type ModePlotting = 'manual' | 'csv';
type KeyFieldAnggota = 'nim' | 'email' | 'nama';

function ProgresLangkah({
  langkah,
  labels,
  onSelectStep,
  themeColors,
  styles,
}: {
  langkah: Langkah;
  labels: [string, string, string, string];
  onSelectStep: (target: Langkah) => void;
  themeColors: ThemeColors;
  styles: ReturnType<typeof buatGaya>;
}) {
  return (
    <View style={styles.progres}>
      <View style={styles.progresGaris}>
        {labels.map((label, i) => {
          const no = (i + 1) as Langkah;
          const selesai = no < langkah;
          const aktif = no === langkah;
          return (
            <Pressable
              key={label}
              disabled={no > langkah}
              onPress={() => {
                if (no <= langkah) onSelectStep(no);
              }}
              style={styles.progresSegmen}
            >
              <View
                style={[
                  styles.progresPenghubung,
                  i === 0 && styles.progresPenghubungKosong,
                  i > 0 && no <= langkah ? styles.progresPenghubungAktif : null,
                ]}
              />
              <View
                style={[
                  styles.progresTitik,
                  selesai && styles.progresTitikSelesai,
                  aktif && styles.progresTitikAktif,
                ]}
              >
                {selesai ? (
                  <Check
                    size={13}
                    color={themeColors.onPrimary}
                    strokeWidth={3}
                  />
                ) : (
                  <Text
                    style={[
                      styles.progresAngka,
                      aktif && styles.progresAngkaAktif,
                    ]}
                  >
                    {no}
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.progresPenghubung,
                  i === labels.length - 1 && styles.progresPenghubungKosong,
                  i < labels.length - 1 && no + 1 <= langkah
                    ? styles.progresPenghubungAktif
                    : null,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.progresLabelBaris}>
        {labels.map((label, i) => (
          <Text
            key={label}
            style={[
              styles.progresLabel,
              i + 1 <= langkah && styles.progresLabelAktif,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Wizard Pembuatan Kelas Praktikum Baru:
 * 1. Plotting Asprak (Default Manual 2 Asprak + tab opsional Impor CSV sesuai SRS FR-30)
 * 2. Plotting Praktikan (Pilih Manual atau Impor Bulk CSV langsung di dalam alur kelas!)
 * 3. Mata Kuliah (Dropdown), Kode Kelas (Manual), & Hari Praktikum (Dropdown!) + Jam Rutin
 * 4. Pilih Ruangan Lab (Dropdown) & Ringkasan + Auto-generate Sesi Pertemuan 1..N
 */
export default function FormKelasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mk: initialMkParam } = useLocalSearchParams<{ mk?: string }>();
  const { showToast } = useToast();
  const { themeColors: tc, language } = usePreferences();
  const { t } = useLabI18n();
  const isEn = language === 'en';
  const tx = (id: string, en: string) => (isEn ? en : id);

  const { currentUser, users } = useSession();
  const {
    ruanganLabs,
    mataKuliahList,
    keanggotaanAll,
    buatKelasBaru,
  } = useAslabStore();

  const s = useMemo(() => buatGaya(tc), [tc]);

  const poolAsprak = useMemo(
    () =>
      users
        .filter((u) => u.peran === 'asisten')
        .sort((a, b) => a.nama.localeCompare(b.nama)),
    [users],
  );
  const poolPraktikan = useMemo(
    () =>
      users
        .filter((u) => u.peran === 'praktikan')
        .sort((a, b) => a.nama.localeCompare(b.nama)),
    [users],
  );

  const [langkah, setLangkah] = useState<Langkah>(1);
  const [modeAsprak, setModeAsprak] = useState<ModePlotting>('manual');
  const [modePraktikan, setModePraktikan] = useState<ModePlotting>('manual');

  const [selectedAsprakIds, setSelectedAsprakIds] = useState<string[]>([]);
  const [selectedPraktikanIds, setSelectedPraktikanIds] = useState<string[]>(
    [],
  );
  const [cariAsprak, setCariAsprak] = useState('');
  const [cariPraktikan, setCariPraktikan] = useState('');
  const [halAsprak, setHalAsprak] = useState(0);
  const [halPraktikan, setHalPraktikan] = useState(0);

  // State CSV inline (Praktikan & Asprak terpisah sesuai SRS FR-29, FR-30, FR-31)
  const [csvPraktikanRows, setCsvPraktikanRows] = useState<
    BarisReviewAnggota[]
  >([]);
  const [csvPraktikanFile, setCsvPraktikanFile] = useState<string | null>(null);
  const [csvAsprakRows, setCsvAsprakRows] = useState<BarisReviewAnggota[]>([]);
  const [csvAsprakFile, setCsvAsprakFile] = useState<string | null>(null);

  // Info Kelas Manual & Jadwal Rutin
  const [selectedMkVal, setSelectedMkVal] = useState('');
  const [customMk, setCustomMk] = useState(false);
  const [mataKuliah, setMataKuliah] = useState('');
  const [kodeKelasManual, setKodeKelasManual] = useState('');
  const [hariRutin, setHariRutin] = useState<IndeksHari>(5); // Default Jumat
  const [jamMulai, setJamMulai] = useState('09:40');
  const [jamSelesai, setJamSelesai] = useState('11:40');
  const [tanggalMulai, setTanggalMulai] = useState(hariIniYmd());

  // Ruangan Lab
  const [ruangId, setRuangId] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    if (initialMkParam) {
      setSelectedMkVal(initialMkParam);
      setMataKuliah(initialMkParam);
    } else if (mataKuliahList[0]) {
      setSelectedMkVal(mataKuliahList[0].nama);
      setMataKuliah(mataKuliahList[0].nama);
    }
    if (ruanganLabs[0]) {
      setRuangId(ruanganLabs[0].id);
    }
  }, [initialMkParam, mataKuliahList, ruanganLabs]);

  if (currentUser && currentUser.peran !== 'aslab') {
    return <Redirect href="/" />;
  }

  const activeRuang =
    ruanganLabs.find((r) => r.id === ruangId) ?? ruanganLabs[0];
  const mkRule = mataKuliahList.find(
    (m) => m.nama.trim().toLowerCase() === mataKuliah.trim().toLowerCase(),
  );
  const jmlPertemuan = mkRule?.jumlahPertemuan ?? 8;

  const namaHariLabel = (h: IndeksHari) =>
    isEn ? DAFTAR_HARI_EN[h] : DAFTAR_HARI_ID[h];

  const mkOptions = useMemo<DropdownOption[]>(() => {
    const opts: DropdownOption[] = mataKuliahList.map((m) => ({
      label: m.nama,
      value: m.nama,
      subtitle: `${m.jumlahPertemuan} pertemuan · Grace ${m.graceMenit}m · Rp${m.dendaNominal.toLocaleString('id-ID')}`,
    }));
    opts.push({
      label: tx('+ Ketik mata kuliah baru…', '+ Type new course name…'),
      value: CUSTOM_MK_VALUE,
    });
    return opts;
  }, [mataKuliahList, isEn]);

  const hariOptions = useMemo<DropdownOption[]>(
    () =>
      HARI_AKTIF_KAMPUS.map((h) => ({
        label: namaHariLabel(h),
        value: String(h),
      })),
    [isEn],
  );

  const ruangOptions = useMemo<DropdownOption[]>(
    () =>
      ruanganLabs.map((r) => ({
        label: r.nama,
        value: r.id,
        subtitle: `${r.alamat} · Radius ${r.radius} m`,
      })),
    [ruanganLabs],
  );

  // Dummy target lab sementara untuk evaluasi konflik mata kuliah pada baris CSV
  const drafLabTarget = useMemo<Lab | null>(
    () =>
      mataKuliah.trim()
        ? {
            id: '__draf_kelas_baru__',
            nama: `${mataKuliah.trim()} ${kodeKelasManual.trim()}`.trim(),
            mataKuliah: mataKuliah.trim(),
            alamat: activeRuang?.alamat ?? '-',
            lat: activeRuang?.lat ?? -7.048,
            lng: activeRuang?.lng ?? 110.44,
            radius: activeRuang?.radius ?? 100,
          }
        : null,
    [mataKuliah, kodeKelasManual, activeRuang],
  );

  const csvFields = useMemo<FieldDefinisiReview<KeyFieldAnggota>[]>(
    () => [
      { key: 'nim', label: 'NIM', placeholder: '2310512001', keyboardType: 'numeric' },
      {
        key: 'email',
        label: 'Email',
        placeholder: 'nama@tapin.ac.id',
        keyboardType: 'email-address',
      },
      { key: 'nama', label: tx('Nama', 'Name'), placeholder: 'Nama Lengkap' },
    ],
    [isEn],
  );

  const buildReviewItems = useCallback(
    (rows: BarisReviewAnggota[], peran: 'praktikan' | 'asprak') =>
      rows.map<ItemReviewTampil<KeyFieldAnggota>>((b) => {
        const ev = evaluasiBarisAnggota(
          b,
          rows,
          drafLabTarget,
          peran,
          users,
          keanggotaanAll,
        );
        return {
          id: b.id,
          nomorBaris: b.nomorBaris,
          diterima: b.diterima,
          status: ev.status,
          judulUtama:
            ev.matchedUser?.nama ||
            b.nama.trim() ||
            b.nim.trim() ||
            b.email.trim() ||
            `#${b.nomorBaris}`,
          subjudul: [b.nim.trim(), b.email.trim()].filter(Boolean).join(' · '),
          pesanMasalah: ev.alasanKode ? t(ev.alasanKode) : undefined,
          nilaiField: { nim: b.nim, email: b.email, nama: b.nama },
        };
      }),
    [drafLabTarget, users, keanggotaanAll, t],
  );

  const reviewItemsPraktikan = useMemo(
    () => buildReviewItems(csvPraktikanRows, 'praktikan'),
    [buildReviewItems, csvPraktikanRows],
  );
  const reviewItemsAsprak = useMemo(
    () => buildReviewItems(csvAsprakRows, 'asprak'),
    [buildReviewItems, csvAsprakRows],
  );

  const handlePilihCsv = async (jenis: 'praktikan' | 'asprak') => {
    const res = await pilihDanBacaCsv(jenis);
    if (!res.ok) {
      if (!res.canceled) {
        showToast(
          res.errorKind === 'header'
            ? t('csvHeaderError', { cols: HEADER_CSV[jenis].join(', ') })
            : res.errorKind === 'empty'
              ? t('csvEmptyError')
              : t('csvCorruptError'),
        );
      }
      return;
    }
    const mapped: BarisReviewAnggota[] = res.rows.map((r, i) => ({
      id: `${jenis}-csv-${Date.now()}-${i}`,
      nomorBaris: i + 1,
      diterima: true,
      nim: r.nim ?? '',
      email: r.email ?? '',
      nama: r.nama ?? '',
    }));
    if (jenis === 'praktikan') {
      setCsvPraktikanFile(res.fileName);
      setCsvPraktikanRows(mapped);
    } else {
      setCsvAsprakFile(res.fileName);
      setCsvAsprakRows(mapped);
    }
  };

  const terapkanCsvKePilihan = (jenis: 'praktikan' | 'asprak') => {
    const rows = jenis === 'praktikan' ? csvPraktikanRows : csvAsprakRows;
    const validIds: string[] = [];
    for (const b of rows) {
      if (!b.diterima) continue;
      const ev = evaluasiBarisAnggota(
        b,
        rows,
        drafLabTarget,
        jenis,
        users,
        keanggotaanAll,
      );
      if (ev.status === 'valid' && ev.matchedUser) {
        validIds.push(ev.matchedUser.id);
      }
    }
    if (jenis === 'praktikan') {
      setSelectedPraktikanIds((prev) =>
        Array.from(new Set([...prev, ...validIds])),
      );
      setModePraktikan('manual');
      showToast(
        tx(
          `${validIds.length} praktikan dari CSV dimasukkan ke plotting kelas.`,
          `${validIds.length} students from CSV added to class roster.`,
        ),
      );
    } else {
      const merged = Array.from(new Set([...selectedAsprakIds, ...validIds])).slice(
        0,
        2,
      );
      setSelectedAsprakIds(merged);
      setModeAsprak('manual');
      showToast(
        tx(
          `${merged.length} asprak dari CSV dimasukkan ke pengampu kelas.`,
          `${merged.length} Asprak from CSV assigned to class.`,
        ),
      );
    }
  };

  // Filter & Paginasi Asprak
  const filteredAsprak = useMemo(() => {
    const q = cariAsprak.trim().toLowerCase();
    if (!q) return poolAsprak;
    return poolAsprak.filter(
      (u) =>
        u.nama.toLowerCase().includes(q) ||
        (u.nim ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q),
    );
  }, [poolAsprak, cariAsprak]);

  const totalHalAsprak = Math.max(
    1,
    Math.ceil(filteredAsprak.length / PESERTA_PER_HALAMAN),
  );
  const idxHalAsprak = Math.min(halAsprak, totalHalAsprak - 1);
  const barisAsprak = filteredAsprak.slice(
    idxHalAsprak * PESERTA_PER_HALAMAN,
    (idxHalAsprak + 1) * PESERTA_PER_HALAMAN,
  );

  // Cegah NIM/akun Asprak masuk Praktikan
  const asprakNimSet = useMemo(() => {
    const set = new Set<string>();
    for (const id of selectedAsprakIds) {
      const u = poolAsprak.find((a) => a.id === id);
      if (u?.nim?.trim()) set.add(u.nim.trim());
    }
    return set;
  }, [selectedAsprakIds, poolAsprak]);

  const filteredPraktikan = useMemo(() => {
    const q = cariPraktikan.trim().toLowerCase();
    return poolPraktikan.filter((u) => {
      if (selectedAsprakIds.includes(u.id)) return false;
      if (u.nim?.trim() && asprakNimSet.has(u.nim.trim())) return false;
      if (!q) return true;
      return (
        u.nama.toLowerCase().includes(q) ||
        (u.nim ?? '').toLowerCase().includes(q) ||
        (u.kelas ?? '').toLowerCase().includes(q)
      );
    });
  }, [poolPraktikan, cariPraktikan, selectedAsprakIds, asprakNimSet]);

  const totalHalPraktikan = Math.max(
    1,
    Math.ceil(filteredPraktikan.length / PESERTA_PER_HALAMAN),
  );
  const idxHalPraktikan = Math.min(halPraktikan, totalHalPraktikan - 1);
  const barisPraktikan = filteredPraktikan.slice(
    idxHalPraktikan * PESERTA_PER_HALAMAN,
    (idxHalPraktikan + 1) * PESERTA_PER_HALAMAN,
  );

  const selectedAsprakUsers = useMemo(
    () =>
      selectedAsprakIds
        .map((id) => poolAsprak.find((u) => u.id === id))
        .filter((u): u is User => Boolean(u)),
    [selectedAsprakIds, poolAsprak],
  );

  const isPraktikanSudahDiMk = (uid: string) => {
    const mk = mataKuliah.trim().toLowerCase();
    if (!mk) return false;
    return keanggotaanAll.some(
      (k) =>
        k.uid === uid &&
        k.peran === 'praktikan' &&
        k.mataKuliah.trim().toLowerCase() === mk,
    );
  };

  const toggleAsprak = (u: User) => {
    setSelectedAsprakIds((prev) => {
      if (prev.includes(u.id)) return prev.filter((id) => id !== u.id);
      if (prev.length >= 2) {
        showToast(
          tx(
            'Maksimal 2 Asprak pengampu per kelas.',
            'Maximum 2 Asprak per class.',
          ),
        );
        return prev;
      }
      return [...prev, u.id];
    });
  };

  const togglePraktikan = (u: User) => {
    setSelectedPraktikanIds((prev) =>
      prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id],
    );
  };

  const validasiLangkah3 = (): string | null => {
    if (!mataKuliah.trim()) {
      return tx('Pilih atau ketik nama mata kuliah.', 'Enter a course name.');
    }
    if (!kodeKelasManual.trim()) {
      return tx(
        'Ketik kode / nama kelas secara manual (mis. B1, B2).',
        'Type the class code manually (e.g. B1, B2).',
      );
    }
    if (!RE_JAM.test(jamMulai.trim()) || !RE_JAM.test(jamSelesai.trim())) {
      return tx(
        'Format jam harus HH:mm (contoh 09:40 dan 11:40).',
        'Time format must be HH:mm (e.g. 09:40 and 11:40).',
      );
    }
    if (jamSelesai.trim() <= jamMulai.trim()) {
      return tx(
        'Jam selesai harus setelah jam mulai.',
        'End time must be after start time.',
      );
    }
    if (!RE_YMD.test(tanggalMulai.trim())) {
      return tx(
        'Format tanggal mulai harus YYYY-MM-DD.',
        'Start date format must be YYYY-MM-DD.',
      );
    }
    return null;
  };

  const handleLanjut = () => {
    if (langkah === 3) {
      const err = validasiLangkah3();
      if (err) {
        setGalat(err);
        return;
      }
    }
    setGalat(null);
    setLangkah((l) => Math.min(4, l + 1) as Langkah);
  };

  const handleSimpan = async () => {
    const err = validasiLangkah3();
    if (err) {
      setGalat(err);
      setLangkah(3);
      return;
    }
    if (!activeRuang) {
      setGalat(tx('Pilih ruangan laboratorium.', 'Select a lab room.'));
      return;
    }

    setMenyimpan(true);
    try {
      const res = await buatKelasBaru(
        {
          mataKuliah: mataKuliah.trim(),
          kodeKelas: kodeKelasManual.trim(),
          ruanganLabId: activeRuang.id,
          hariRutin,
          jamMulai: jamMulai.trim(),
          jamSelesai: jamSelesai.trim(),
          tanggalMulai: tanggalMulai.trim(),
        },
        selectedAsprakIds,
        selectedPraktikanIds,
      );
      if (!res.ok) {
        setGalat(res.alasan);
        return;
      }
      showToast(
        tx(
          `Kelas ${mataKuliah.trim()} ${kodeKelasManual.trim()} & ${jmlPertemuan} sesi rutin berhasil dibuat.`,
          `Class ${mataKuliah.trim()} ${kodeKelasManual.trim()} & ${jmlPertemuan} weekly sessions created.`,
        ),
      );
      router.back();
    } finally {
      setMenyimpan(false);
    }
  };

  const tglPertemuan1Preview = RE_YMD.test(tanggalMulai.trim())
    ? hitungTanggalPertemuanRutin(tanggalMulai.trim(), hariRutin, 0)
    : '—';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
        >
          <ArrowLeft size={20} color={tc.textPrimary} />
        </Pressable>
        <Text style={s.topBarTitle} numberOfLines={1}>
          {tx('Buat Kelas Praktikum', 'Create Practicum Class')}
        </Text>
        <View style={s.topBarSide} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          <ProgresLangkah
            langkah={langkah}
            labels={[
              tx('Asprak', 'Asprak'),
              tx('Praktikan', 'Students'),
              tx('Kelas & Jadwal', 'Class & Time'),
              tx('Ruang & Simpan', 'Room & Save'),
            ]}
            onSelectStep={(target) => {
              setGalat(null);
              setLangkah(target);
            }}
            themeColors={tc}
            styles={s}
          />

          {/* LANGKAH 1: Plotting 2 Asprak (Default Manual + Opsi CSV untuk SRS FR-30) */}
          {langkah === 1 ? (
            <View style={s.card}>
              <View style={s.headerRow}>
                <View>
                  <Text style={s.cardHeader}>
                    {tx('1 · Plotting Asprak Pengampu', '1 · Assign Asprak')}
                  </Text>
                  <Text style={s.counterText}>
                    {selectedAsprakIds.length} / 2{' '}
                    {tx('asprak dipilih', 'asprak selected')}
                  </Text>
                </View>
                {selectedAsprakIds.length > 0 ? (
                  <Pressable
                    onPress={() => setSelectedAsprakIds([])}
                    style={s.smallPillBtn}
                  >
                    <Text style={s.smallPillBtnText}>Reset</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Segmented Switcher: Pilih Manual (Default) | Impor CSV */}
              <View style={s.modeSegment}>
                <Pressable
                  onPress={() => setModeAsprak('manual')}
                  style={[
                    s.modeTab,
                    modeAsprak === 'manual' && s.modeTabActive,
                  ]}
                >
                  <Text
                    style={[
                      s.modeTabText,
                      modeAsprak === 'manual' && s.modeTabTextActive,
                    ]}
                  >
                    {tx('Pilih Manual (2 Orang)', 'Manual Pick (2 Asprak)')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setModeAsprak('csv')}
                  style={[s.modeTab, modeAsprak === 'csv' && s.modeTabActive]}
                >
                  <Text
                    style={[
                      s.modeTabText,
                      modeAsprak === 'csv' && s.modeTabTextActive,
                    ]}
                  >
                    {tx('Unggah CSV', 'Upload CSV')}
                  </Text>
                </Pressable>
              </View>

              {modeAsprak === 'manual' ? (
                <>
                  <View style={s.searchPill}>
                    <Search size={16} color={tc.textMuted} />
                    <TextInput
                      value={cariAsprak}
                      onChangeText={(txt) => {
                        setCariAsprak(txt);
                        setHalAsprak(0);
                      }}
                      placeholder={tx(
                        'Cari nama atau NIM asprak…',
                        'Search Asprak name or NIM…',
                      )}
                      placeholderTextColor={tc.textMuted}
                      style={s.searchInput}
                    />
                  </View>

                  {filteredAsprak.length === 0 ? (
                    <Text style={s.emptyText}>
                      {tx('Tidak ada data asprak.', 'No Asprak found.')}
                    </Text>
                  ) : (
                    <View style={s.tabel}>
                      <View style={s.tabelHeader}>
                        <View style={s.colCheck} />
                        <Text style={[s.th, s.colName]}>
                          {tx('Nama', 'Name')}
                        </Text>
                        <Text style={[s.th, s.colNim]}>NIM</Text>
                      </View>
                      {barisAsprak.map((u) => {
                        const checked = selectedAsprakIds.includes(u.id);
                        return (
                          <Pressable
                            key={u.id}
                            onPress={() => toggleAsprak(u)}
                            style={[s.tr, checked && s.trActive]}
                          >
                            <View style={s.colCheck}>
                              <View style={[s.cb, checked && s.cbActive]}>
                                {checked ? (
                                  <Check
                                    size={12}
                                    color={tc.onPrimary}
                                    strokeWidth={3}
                                  />
                                ) : null}
                              </View>
                            </View>
                            <Text style={[s.tdMain, s.colName]} numberOfLines={1}>
                              {u.nama}
                            </Text>
                            <Text style={[s.tdSub, s.colNim]} numberOfLines={1}>
                              {u.nim ?? '–'}
                            </Text>
                          </Pressable>
                        );
                      })}
                      {totalHalAsprak > 1 ? (
                        <View style={s.paginasi}>
                          <Pressable
                            disabled={idxHalAsprak === 0}
                            onPress={() =>
                              setHalAsprak(Math.max(0, idxHalAsprak - 1))
                            }
                            style={[
                              s.pageBtn,
                              idxHalAsprak === 0 && { opacity: 0.35 },
                            ]}
                          >
                            <ChevronLeft size={16} color={tc.textPrimary} />
                          </Pressable>
                          <Text style={s.pageText}>
                            {idxHalAsprak * PESERTA_PER_HALAMAN + 1}–
                            {Math.min(
                              (idxHalAsprak + 1) * PESERTA_PER_HALAMAN,
                              filteredAsprak.length,
                            )}{' '}
                            / {filteredAsprak.length}
                          </Text>
                          <Pressable
                            disabled={idxHalAsprak >= totalHalAsprak - 1}
                            onPress={() =>
                              setHalAsprak(
                                Math.min(totalHalAsprak - 1, idxHalAsprak + 1),
                              )
                            }
                            style={[
                              s.pageBtn,
                              idxHalAsprak >= totalHalAsprak - 1 && {
                                opacity: 0.35,
                              },
                            ]}
                          >
                            <ChevronRight size={16} color={tc.textPrimary} />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  )}
                </>
              ) : (
                <View style={{ gap: 12 }}>
                  <View style={s.csvToolbar}>
                    <Tombol
                      variant="sekunder"
                      icon={<Download size={15} color={tc.textPrimary} />}
                      onPress={() => void unduhTemplateCsv('asprak')}
                      style={{ flex: 1 }}
                    >
                      {tx('Template CSV', 'CSV Template')}
                    </Tombol>
                    <Tombol
                      variant="primer"
                      icon={<Upload size={15} color={tc.onPrimary} />}
                      onPress={() => void handlePilihCsv('asprak')}
                      style={{ flex: 1 }}
                    >
                      {csvAsprakFile
                        ? tx('Ganti CSV', 'Replace CSV')
                        : tx('Pilih CSV', 'Pick CSV')}
                    </Tombol>
                  </View>

                  <ImportReviewList
                    items={reviewItemsAsprak}
                    fields={csvFields}
                    onToggleTerima={(id) =>
                      setCsvAsprakRows((prev) =>
                        prev.map((r) =>
                          r.id === id ? { ...r, diterima: !r.diterima } : r,
                        ),
                      )
                    }
                    onTerimaSemuaValid={() =>
                      setCsvAsprakRows((prev) =>
                        prev.map((r) => {
                          const ev = evaluasiBarisAnggota(
                            r,
                            prev,
                            drafLabTarget,
                            'asprak',
                            users,
                            keanggotaanAll,
                          );
                          return ev.status === 'valid'
                            ? { ...r, diterima: true }
                            : r;
                        }),
                      )
                    }
                    onTolakSemua={() =>
                      setCsvAsprakRows((prev) =>
                        prev.map((r) => ({ ...r, diterima: false })),
                      )
                    }
                    onUbahField={(id, key, nilai) =>
                      setCsvAsprakRows((prev) =>
                        prev.map((r) =>
                          r.id === id ? { ...r, [key]: nilai } : r,
                        ),
                      )
                    }
                    onSimpan={() => terapkanCsvKePilihan('asprak')}
                  />
                </View>
              )}
            </View>
          ) : null}

          {/* LANGKAH 2: Plotting Praktikan (Pilih Manual vs Unggah Bulk CSV menyatu!) */}
          {langkah === 2 ? (
            <View style={s.card}>
              <View style={s.headerRow}>
                <View>
                  <Text style={s.cardHeader}>
                    {tx('2 · Plotting Praktikan', '2 · Assign Students')}
                  </Text>
                  <Text style={s.counterText}>
                    {selectedPraktikanIds.length}{' '}
                    {tx('praktikan dipilih', 'students selected')}
                  </Text>
                </View>
                {modePraktikan === 'manual' ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => {
                        const validIds = filteredPraktikan
                          .filter((p) => !isPraktikanSudahDiMk(p.id))
                          .map((p) => p.id);
                        setSelectedPraktikanIds((prev) =>
                          Array.from(new Set([...prev, ...validIds])),
                        );
                      }}
                      style={s.smallPillBtn}
                    >
                      <Text style={s.smallPillBtnText}>
                        {tx('Pilih Semua', 'Select All')}
                      </Text>
                    </Pressable>
                    {selectedPraktikanIds.length > 0 ? (
                      <Pressable
                        onPress={() => setSelectedPraktikanIds([])}
                        style={s.smallPillBtn}
                      >
                        <Text style={s.smallPillBtnText}>Reset</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View style={s.contextBanner}>
                <UserCheck size={14} color={tc.sesiDibukaFg} />
                <Text style={s.contextBannerText} numberOfLines={2}>
                  {selectedAsprakUsers.length > 0
                    ? `${tx('Diampu oleh:', 'Led by:')} ${selectedAsprakUsers
                        .map((a) => a.nama)
                        .join(' & ')}`
                    : tx(
                        'Belum memilih Asprak di langkah 1 (opsional).',
                        'No Asprak selected yet (optional).',
                      )}
                </Text>
              </View>

              {/* Segmented Switcher: Pilih Manual vs Unggah Bulk CSV */}
              <View style={s.modeSegment}>
                <Pressable
                  onPress={() => setModePraktikan('manual')}
                  style={[
                    s.modeTab,
                    modePraktikan === 'manual' && s.modeTabActive,
                  ]}
                >
                  <Text
                    style={[
                      s.modeTabText,
                      modePraktikan === 'manual' && s.modeTabTextActive,
                    ]}
                  >
                    {tx('Pilih Manual', 'Select Manually')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setModePraktikan('csv')}
                  style={[
                    s.modeTab,
                    modePraktikan === 'csv' && s.modeTabActive,
                  ]}
                >
                  <Text
                    style={[
                      s.modeTabText,
                      modePraktikan === 'csv' && s.modeTabTextActive,
                    ]}
                  >
                    {tx('Masukkan Bulk CSV', 'Import Bulk CSV')}
                  </Text>
                </Pressable>
              </View>

              {modePraktikan === 'manual' ? (
                <>
                  <View style={s.searchPill}>
                    <Search size={16} color={tc.textMuted} />
                    <TextInput
                      value={cariPraktikan}
                      onChangeText={(txt) => {
                        setCariPraktikan(txt);
                        setHalPraktikan(0);
                      }}
                      placeholder={tx(
                        'Cari nama atau NIM praktikan…',
                        'Search student name or NIM…',
                      )}
                      placeholderTextColor={tc.textMuted}
                      style={s.searchInput}
                    />
                  </View>

                  {filteredPraktikan.length === 0 ? (
                    <Text style={s.emptyText}>
                      {tx('Tidak ada data praktikan.', 'No students found.')}
                    </Text>
                  ) : (
                    <View style={s.tabel}>
                      <View style={s.tabelHeader}>
                        <View style={s.colCheck} />
                        <Text style={[s.th, s.colName]}>
                          {tx('Nama', 'Name')}
                        </Text>
                        <Text style={[s.th, s.colNim]}>NIM</Text>
                      </View>
                      {barisPraktikan.map((p) => {
                        const checked = selectedPraktikanIds.includes(p.id);
                        const locked = isPraktikanSudahDiMk(p.id);
                        return (
                          <Pressable
                            key={p.id}
                            disabled={locked}
                            onPress={() => togglePraktikan(p)}
                            style={[
                              s.tr,
                              checked && s.trActive,
                              locked && { opacity: 0.4 },
                            ]}
                          >
                            <View style={s.colCheck}>
                              <View style={[s.cb, checked && s.cbActive]}>
                                {checked ? (
                                  <Check
                                    size={12}
                                    color={tc.onPrimary}
                                    strokeWidth={3}
                                  />
                                ) : null}
                              </View>
                            </View>
                            <Text style={[s.tdMain, s.colName]} numberOfLines={1}>
                              {p.nama}
                            </Text>
                            <Text style={[s.tdSub, s.colNim]} numberOfLines={1}>
                              {p.nim ?? '–'}
                            </Text>
                          </Pressable>
                        );
                      })}
                      {totalHalPraktikan > 1 ? (
                        <View style={s.paginasi}>
                          <Pressable
                            disabled={idxHalPraktikan === 0}
                            onPress={() =>
                              setHalPraktikan(Math.max(0, idxHalPraktikan - 1))
                            }
                            style={[
                              s.pageBtn,
                              idxHalPraktikan === 0 && { opacity: 0.35 },
                            ]}
                          >
                            <ChevronLeft size={16} color={tc.textPrimary} />
                          </Pressable>
                          <Text style={s.pageText}>
                            {idxHalPraktikan * PESERTA_PER_HALAMAN + 1}–
                            {Math.min(
                              (idxHalPraktikan + 1) * PESERTA_PER_HALAMAN,
                              filteredPraktikan.length,
                            )}{' '}
                            / {filteredPraktikan.length}
                          </Text>
                          <Pressable
                            disabled={idxHalPraktikan >= totalHalPraktikan - 1}
                            onPress={() =>
                              setHalPraktikan(
                                Math.min(
                                  totalHalPraktikan - 1,
                                  idxHalPraktikan + 1,
                                ),
                              )
                            }
                            style={[
                              s.pageBtn,
                              idxHalPraktikan >= totalHalPraktikan - 1 && {
                                opacity: 0.35,
                              },
                            ]}
                          >
                            <ChevronRight size={16} color={tc.textPrimary} />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  )}
                </>
              ) : (
                <View style={{ gap: 12 }}>
                  <View style={s.csvToolbar}>
                    <Tombol
                      variant="sekunder"
                      icon={<Download size={15} color={tc.textPrimary} />}
                      onPress={() => void unduhTemplateCsv('praktikan')}
                      style={{ flex: 1 }}
                    >
                      {tx('Template CSV', 'CSV Template')}
                    </Tombol>
                    <Tombol
                      variant="primer"
                      icon={<Upload size={15} color={tc.onPrimary} />}
                      onPress={() => void handlePilihCsv('praktikan')}
                      style={{ flex: 1 }}
                    >
                      {csvPraktikanFile
                        ? tx('Ganti CSV', 'Replace CSV')
                        : tx('Pilih CSV', 'Pick CSV')}
                    </Tombol>
                  </View>

                  <ImportReviewList
                    items={reviewItemsPraktikan}
                    fields={csvFields}
                    onToggleTerima={(id) =>
                      setCsvPraktikanRows((prev) =>
                        prev.map((r) =>
                          r.id === id ? { ...r, diterima: !r.diterima } : r,
                        ),
                      )
                    }
                    onTerimaSemuaValid={() =>
                      setCsvPraktikanRows((prev) =>
                        prev.map((r) => {
                          const ev = evaluasiBarisAnggota(
                            r,
                            prev,
                            drafLabTarget,
                            'praktikan',
                            users,
                            keanggotaanAll,
                          );
                          return ev.status === 'valid'
                            ? { ...r, diterima: true }
                            : r;
                        }),
                      )
                    }
                    onTolakSemua={() =>
                      setCsvPraktikanRows((prev) =>
                        prev.map((r) => ({ ...r, diterima: false })),
                      )
                    }
                    onUbahField={(id, key, nilai) =>
                      setCsvPraktikanRows((prev) =>
                        prev.map((r) =>
                          r.id === id ? { ...r, [key]: nilai } : r,
                        ),
                      )
                    }
                    onSimpan={() => terapkanCsvKePilihan('praktikan')}
                  />
                </View>
              )}
            </View>
          ) : null}

          {/* LANGKAH 3: Mata Kuliah, Kode Kelas Manual, & Hari Praktikum (Dropdown!) */}
          {langkah === 3 ? (
            <View style={s.card}>
              <Text style={s.cardHeader}>
                {tx('Kelas & Jadwal Rutin', 'Class & Weekly Schedule')}
              </Text>

              <DropdownSelect
                label={tx('Mata Kuliah', 'Course')}
                value={customMk ? CUSTOM_MK_VALUE : selectedMkVal}
                placeholder={tx('Pilih mata kuliah…', 'Select course…')}
                options={mkOptions}
                onSelect={(val) => {
                  if (val === CUSTOM_MK_VALUE) {
                    setCustomMk(true);
                    setSelectedMkVal(CUSTOM_MK_VALUE);
                    setMataKuliah('');
                  } else {
                    setCustomMk(false);
                    setSelectedMkVal(val);
                    setMataKuliah(val);
                  }
                  setGalat(null);
                }}
              />

              {customMk ? (
                <View style={s.inputContainer}>
                  <Text style={s.inputLabel}>
                    {tx('Ketik Nama Mata Kuliah', 'Type Course Name')}
                  </Text>
                  <TextInput
                    value={mataKuliah}
                    onChangeText={(txt) => {
                      setMataKuliah(txt);
                      setGalat(null);
                    }}
                    placeholder={tx('Contoh: Basis Data', 'e.g. Basis Data')}
                    placeholderTextColor={tc.textMuted}
                    style={s.textInput}
                  />
                </View>
              ) : null}

              {/* Kode Kelas Manual */}
              <View style={s.inputContainer}>
                <Text style={s.inputLabel}>
                  {tx(
                    'Kode / Nama Kelas (Ketik Manual)',
                    'Class Code / Name (Manual Input)',
                  )}
                </Text>
                <TextInput
                  value={kodeKelasManual}
                  onChangeText={(txt) => {
                    setKodeKelasManual(txt);
                    setGalat(null);
                  }}
                  placeholder={tx(
                    'Contoh: B1, B2, D1, atau Kelas Reguler C',
                    'e.g. B1, B2, D1, or Intl-A',
                  )}
                  placeholderTextColor={tc.textMuted}
                  style={s.textInput}
                />
              </View>

              {/* Hari Praktikum menggunakan DropdownSelect! */}
              <DropdownSelect
                label={tx('Hari Praktikum Rutin', 'Recurring Day of Week')}
                value={String(hariRutin)}
                options={hariOptions}
                onSelect={(val) => setHariRutin(Number(val) as IndeksHari)}
              />

              <View style={s.twoCol}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={s.inputLabel}>
                    {tx('Jam Mulai (HH:mm)', 'Start Time')}
                  </Text>
                  <TextInput
                    value={jamMulai}
                    onChangeText={setJamMulai}
                    placeholder="09:40"
                    placeholderTextColor={tc.textMuted}
                    style={s.textInput}
                  />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={s.inputLabel}>
                    {tx('Jam Selesai (HH:mm)', 'End Time')}
                  </Text>
                  <TextInput
                    value={jamSelesai}
                    onChangeText={setJamSelesai}
                    placeholder="11:40"
                    placeholderTextColor={tc.textMuted}
                    style={s.textInput}
                  />
                </View>
              </View>

              <View style={s.inputContainer}>
                <Text style={s.inputLabel}>
                  {tx(
                    'Mulai Minggu Praktikum (YYYY-MM-DD)',
                    'Start Week Date (YYYY-MM-DD)',
                  )}
                </Text>
                <TextInput
                  value={tanggalMulai}
                  onChangeText={setTanggalMulai}
                  placeholder="2026-11-28"
                  placeholderTextColor={tc.textMuted}
                  style={s.textInput}
                />
                <View style={s.autoDatePill}>
                  <CalendarClock size={14} color={tc.sesiDibukaFg} />
                  <Text style={s.autoDateText}>
                    {tx(
                      `Otomatis setiap ${namaHariLabel(hariRutin)} (${jamMulai}–${jamSelesai}) · Pertemuan 1: ${tglPertemuan1Preview}`,
                      `Auto every ${namaHariLabel(hariRutin)} (${jamMulai}–${jamSelesai}) · Meeting 1: ${tglPertemuan1Preview}`,
                    )}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* LANGKAH 4: Pilih Ruangan Lab (Dropdown) & Ringkasan */}
          {langkah === 4 ? (
            <>
              <View style={s.card}>
                <Text style={s.cardHeader}>
                  {tx('Lokasi Ruangan Lab', 'Laboratory Room')}
                </Text>

                <DropdownSelect
                  label={tx('Ruangan Laboratorium', 'Laboratory Room')}
                  value={activeRuang?.id ?? ''}
                  placeholder={tx('Pilih ruangan…', 'Select room…')}
                  options={ruangOptions}
                  onSelect={(val) => setRuangId(val)}
                />

                {activeRuang ? (
                  <View style={s.roomSummaryBox}>
                    <MapPin size={15} color={tc.sesiDibukaFg} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.roomSummaryTitle}>
                        {activeRuang.nama} · Radius {activeRuang.radius} m
                      </Text>
                      <Text style={s.roomSummarySub}>{activeRuang.alamat}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={s.ringkasan}>
                <Text style={s.ringkasanJudul}>
                  {tx('Ringkasan Kelas Praktikum', 'Class Summary')}
                </Text>
                <Text style={s.ringkasanTeks}>
                  <Text style={s.ringkasanTebal}>
                    {mataKuliah.trim()} {kodeKelasManual.trim()}
                  </Text>{' '}
                  · {jmlPertemuan} {tx('pertemuan', 'meetings')}
                </Text>
                <Text style={s.ringkasanTeks}>
                  {tx('Setiap', 'Every')} {namaHariLabel(hariRutin)}, {jamMulai}
                  –{jamSelesai} · {activeRuang?.nama ?? '—'}
                </Text>
                <Text style={s.ringkasanTeks}>
                  Asprak ({selectedAsprakUsers.length}):{' '}
                  {selectedAsprakUsers.map((a) => a.nama).join(' & ') || '—'}
                </Text>
                <Text style={s.ringkasanTeks}>
                  {selectedPraktikanIds.length}{' '}
                  {tx('praktikan di-plot', 'students assigned')}
                </Text>
              </View>
            </>
          ) : null}

          {galat ? (
            <View style={s.errorBox}>
              <AlertTriangle size={15} color={tc.errorFg} />
              <Text style={s.errorText}>{galat}</Text>
            </View>
          ) : null}

          <View style={s.navLangkah}>
            <Pressable
              disabled={menyimpan}
              onPress={() => {
                if (langkah === 1) router.back();
                else {
                  setGalat(null);
                  setLangkah((l) => Math.max(1, l - 1) as Langkah);
                }
              }}
              style={({ pressed }) => [
                s.tombolKembali,
                pressed && s.pressed,
              ]}
            >
              <Text style={s.tombolKembaliTeks}>
                {langkah === 1
                  ? tx('Batal', 'Cancel')
                  : tx('Kembali', 'Back')}
              </Text>
            </Pressable>

            <Pressable
              disabled={menyimpan}
              onPress={
                langkah < 4 ? handleLanjut : () => void handleSimpan()
              }
              style={({ pressed }) => [
                s.tombolLanjut,
                menyimpan && { opacity: 0.5 },
                pressed && s.pressed,
              ]}
            >
              <Text style={s.tombolLanjutTeks}>
                {langkah < 4
                  ? tx('Lanjut', 'Next')
                  : menyimpan
                    ? tx('Menyimpan…', 'Saving…')
                    : tx('Simpan Kelas', 'Save Class')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: w.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.s3,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBarSide: { width: 44, height: 44 },
    topBarTitle: {
      ...tipe.h2,
      fontSize: 18,
      color: w.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    scrollContent: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 540,
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.s2,
      gap: 16,
    },
    progres: { gap: 6, paddingHorizontal: 2 },
    progresGaris: { flexDirection: 'row', alignItems: 'center' },
    progresSegmen: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    progresPenghubung: {
      flex: 1,
      height: 3,
      borderRadius: radius.pill,
      backgroundColor: w.surfaceMuted,
    },
    progresPenghubungAktif: { backgroundColor: w.primary },
    progresPenghubungKosong: { backgroundColor: 'transparent' },
    progresTitik: {
      width: 26,
      height: 26,
      borderRadius: radius.pill,
      backgroundColor: w.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progresTitikSelesai: { backgroundColor: w.primary },
    progresTitikAktif: {
      backgroundColor: w.surface,
      borderColor: w.primary,
      borderWidth: 2.5,
    },
    progresAngka: {
      fontSize: 11,
      fontFamily: fontFamily.bold,
      color: w.textMuted,
    },
    progresAngkaAktif: { color: w.textPrimary },
    progresLabelBaris: { flexDirection: 'row' },
    progresLabel: {
      flex: 1,
      fontSize: 10.5,
      fontFamily: fontFamily.semibold,
      color: w.textMuted,
      textAlign: 'center',
    },
    progresLabelAktif: {
      color: w.textPrimary,
      fontFamily: fontFamily.bold,
    },
    card: {
      backgroundColor: w.surface,
      borderColor: w.border,
      borderWidth: 1,
      borderRadius: 24,
      padding: 18,
      gap: 14,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    cardHeader: {
      fontSize: 16,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    counterText: {
      fontSize: 12,
      fontFamily: fontFamily.medium,
      color: w.textSecondary,
      marginTop: 2,
    },
    cardSub: {
      ...tipe.caption,
      color: w.textSecondary,
      lineHeight: 18,
    },
    modeSegment: {
      flexDirection: 'row',
      backgroundColor: w.surfaceMuted,
      borderRadius: radius.pill,
      padding: 4,
    },
    modeTab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: radius.pill,
      alignItems: 'center',
    },
    modeTabActive: {
      backgroundColor: w.surface,
    },
    modeTabText: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.textMuted,
    },
    modeTabTextActive: {
      color: w.textPrimary,
      fontFamily: fontFamily.bold,
    },
    csvToolbar: {
      flexDirection: 'row',
      gap: 8,
    },
    smallPillBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
    },
    smallPillBtnText: {
      fontSize: 11.5,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    contextBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 14,
      backgroundColor: w.sesiDibukaBg,
      borderWidth: 1,
      borderColor: w.radiusInsideBorder,
    },
    contextBannerText: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.sesiDibukaFg,
      flex: 1,
    },
    searchPill: {
      height: 46,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: fontFamily.regular,
      color: w.textPrimary,
      paddingVertical: 6,
    },
    emptyText: {
      ...tipe.caption,
      color: w.textMuted,
      paddingVertical: 8,
    },
    tabel: {
      borderColor: w.border,
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    tabelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: w.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    th: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: w.textSecondary,
    },
    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: w.surface,
      borderTopWidth: 1,
      borderTopColor: w.border,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    trActive: { backgroundColor: w.sesiDibukaBg },
    colCheck: { width: 30 },
    colName: { flex: 1, paddingRight: 8 },
    colNim: { width: 108, textAlign: 'right' },
    tdMain: {
      fontSize: 14,
      fontFamily: fontFamily.semibold,
      color: w.textPrimary,
    },
    tdSub: {
      fontSize: 12,
      fontFamily: fontFamily.medium,
      color: w.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    cb: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: w.borderDashed,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: w.surface,
    },
    cbActive: {
      backgroundColor: w.primary,
      borderColor: w.primaryPressed,
    },
    paginasi: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: w.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    pageBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      backgroundColor: w.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageText: {
      fontSize: 12,
      fontFamily: fontFamily.medium,
      color: w.textSecondary,
    },
    inputContainer: { gap: 6 },
    inputLabel: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
      marginLeft: 4,
    },
    textInput: {
      height: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      paddingHorizontal: 15,
      fontSize: 14,
      fontFamily: fontFamily.medium,
      color: w.textPrimary,
    },
    twoCol: { flexDirection: 'row', gap: 12 },
    autoDatePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: w.sesiDibukaBg,
      borderWidth: 1,
      borderColor: w.radiusInsideBorder,
      marginTop: 4,
    },
    autoDateText: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.sesiDibukaFg,
      flex: 1,
      lineHeight: 17,
    },
    roomSummaryBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 14,
      borderRadius: 16,
      backgroundColor: w.surfaceMuted,
      borderWidth: 1,
      borderColor: w.border,
    },
    roomSummaryTitle: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    roomSummarySub: {
      fontSize: 12,
      fontFamily: fontFamily.regular,
      color: w.textSecondary,
    },
    ringkasan: {
      backgroundColor: w.surface,
      borderColor: w.border,
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
      gap: 4,
    },
    ringkasanJudul: {
      fontSize: 13,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
      marginBottom: 2,
    },
    ringkasanTeks: {
      fontSize: 12,
      fontFamily: fontFamily.regular,
      color: w.textSecondary,
      lineHeight: 18,
    },
    ringkasanTebal: {
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 14,
      borderRadius: 16,
      backgroundColor: w.errorBg,
      borderWidth: 1,
      borderColor: w.dangerBorder,
    },
    errorText: {
      fontSize: 12,
      fontFamily: fontFamily.medium,
      color: w.errorFg,
      flex: 1,
    },
    navLangkah: { flexDirection: 'row', gap: 10, marginTop: 4 },
    tombolKembali: {
      flex: 1,
      height: 52,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tombolKembaliTeks: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    tombolLanjut: {
      flex: 1.4,
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: w.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tombolLanjutTeks: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: w.onPrimary,
    },
    pressed: { opacity: 0.8 },
  });
