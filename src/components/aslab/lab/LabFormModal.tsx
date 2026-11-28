import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Search,
  UserCheck,
  Users,
} from 'lucide-react-native';

import { REGION_KAMPUS_FSM } from '@/components/peta/region';
import { SheetModal, Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { LABS_SEED, type Lab, type User } from '@/data/dummy';
import {
  fontFamily,
  radius,
  spacing,
  type,
  type ThemeColors,
} from '@/theme/tokens';
import type { Titik } from '@/utils/geo';
import { useLabI18n } from './i18nLab';
import {
  DEFAULT_DENDA_NOMINAL,
  DEFAULT_GRACE_MENIT,
  DEFAULT_JUMLAH_PERTEMUAN,
  DEFAULT_RADIUS_LAB,
  validasiFormLab,
} from './validasiManajemenLab';

export interface LabFormModalProps {
  visible: boolean;
  initialLab?: Lab | null;
  onClose: () => void;
}

type StepNumber = 1 | 2 | 3 | 4 | 5;

const STEP_COLORS: Record<StepNumber, string> = {
  1: '#06B6D4', // 01 Asprak
  2: '#3B4CCA', // 02 Praktikan
  3: '#9333EA', // 03 Kelas
  4: '#EC4899', // 04 Lokasi
  5: '#F97316', // 05 Tinjau
};

interface RoomOption {
  id: string;
  namaRuang: string;
  alamat: string;
  lat: number;
  lng: number;
  radius: number;
}

/**
 * Wizard 5 Langkah Pembuatan Kelas Praktikum (dan Edit Konfigurasi) untuk Aslab.
 * Alur diagram 01 → 02 → 03 → 04 → 05:
 *   01 Plotting Asprak (2 pengampu)
 *   02 Plotting Praktikan (diampu 2 asprak tsb)
 *   03 Mata Kuliah, Nama Kelas (mis. Basis Data B2) & Jumlah Pertemuan
 *   04 Lokasi Ruangan Lab (dropdown murni dari database) + Radius & Aturan Seragam Matkul
 *   05 Ringkasan & Simpan
 */
export function LabFormModal({
  visible,
  initialLab = null,
  onClose,
}: LabFormModalProps) {
  const {
    currentUser,
    labs,
    users,
    keanggotaanLab,
    createLab,
    updateLab,
    addAnggotaBulk,
  } = useSession();
  const { showToast } = useToast();
  const { themeColors } = usePreferences();
  const { t } = useLabI18n();
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);

  const isEdit = Boolean(initialLab);

  // Daftar ruangan lab fisik (dropdown murni dari database)
  const roomOptions = useMemo<RoomOption[]>(() => {
    const peta = new Map<string, RoomOption>();
    // Prioritaskan ruangan fisik standar dari LABS_SEED
    for (const seed of LABS_SEED) {
      const key = seed.nama.trim().toLowerCase();
      peta.set(key, {
        id: seed.id,
        namaRuang: seed.nama.trim(),
        alamat: seed.alamat.trim(),
        lat: seed.lat,
        lng: seed.lng,
        radius: seed.radius,
      });
    }
    // Tambahkan ruangan fisik lain yang mungkin sudah tersimpan di labs
    for (const item of labs) {
      const namaRuang = (item.ruanganLab ?? item.nama).trim();
      const key = namaRuang.toLowerCase();
      if (!peta.has(key) && Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
        peta.set(key, {
          id: item.id,
          namaRuang,
          alamat: item.alamat.trim(),
          lat: item.lat,
          lng: item.lng,
          radius: item.radius,
        });
      }
    }
    return Array.from(peta.values()).sort((a, b) =>
      a.namaRuang.localeCompare(b.namaRuang),
    );
  }, [labs]);

  // Daftar mata kuliah yang sudah ada (beserta aturan seragamnya)
  const existingCourses = useMemo(() => {
    const peta = new Map<
      string,
      {
        mataKuliah: string;
        jumlahPertemuan: number;
        graceMenit: number;
        dendaNominal: number;
      }
    >();
    for (const l of labs) {
      const mk = (l.mataKuliah ?? '').trim();
      if (!mk) continue;
      const key = mk.toLowerCase();
      if (!peta.has(key)) {
        peta.set(key, {
          mataKuliah: mk,
          jumlahPertemuan: l.jumlahPertemuan ?? DEFAULT_JUMLAH_PERTEMUAN,
          graceMenit: l.graceMenit ?? DEFAULT_GRACE_MENIT,
          dendaNominal: l.dendaNominal ?? DEFAULT_DENDA_NOMINAL,
        });
      }
    }
    return Array.from(peta.values()).sort((a, b) =>
      a.mataKuliah.localeCompare(b.mataKuliah),
    );
  }, [labs]);

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

  // State wizard
  const [step, setStep] = useState<StepNumber>(1);
  const [selectedAsprakIds, setSelectedAsprakIds] = useState<string[]>([]);
  const [selectedPraktikanIds, setSelectedPraktikanIds] = useState<string[]>(
    [],
  );
  const [cariAsprak, setCariAsprak] = useState('');
  const [cariPraktikan, setCariPraktikan] = useState('');

  // State kelas, lokasi dropdown, dan aturan seragam
  const [mataKuliah, setMataKuliah] = useState('');
  const [namaKelas, setNamaKelas] = useState('');
  const [pertemuanTeks, setPertemuanTeks] = useState(
    String(DEFAULT_JUMLAH_PERTEMUAN),
  );
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [ruanganLab, setRuanganLab] = useState('');
  const [alamat, setAlamat] = useState('');
  const [titik, setTitik] = useState<Titik | null>(null);
  const [radiusTeks, setRadiusTeks] = useState(String(DEFAULT_RADIUS_LAB));
  const [graceTeks, setGraceTeks] = useState(String(DEFAULT_GRACE_MENIT));
  const [dendaTeks, setDendaTeks] = useState(String(DEFAULT_DENDA_NOMINAL));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syncedFromCourse, setSyncedFromCourse] = useState<string | null>(null);

  const [cobaSimpan, setCobaSimpan] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null);

  const terapkanRuangan = (room: RoomOption, resetRadius = false) => {
    setSelectedRoomId(room.id);
    setRuanganLab(room.namaRuang);
    setAlamat(room.alamat);
    setTitik({ lat: room.lat, lng: room.lng });
    if (resetRadius) {
      setRadiusTeks(
        Number.isFinite(room.radius) && room.radius > 0
          ? String(room.radius)
          : String(DEFAULT_RADIUS_LAB),
      );
    }
  };

  // Sinkronisasi otomatis aturan saat mengetik/memilih mata kuliah yang sudah ada
  const terapkanAturanMatkul = (mkInput: string) => {
    setMataKuliah(mkInput);
    const key = mkInput.trim().toLowerCase();
    const cocok = existingCourses.find(
      (c) => c.mataKuliah.trim().toLowerCase() === key,
    );
    if (cocok) {
      setPertemuanTeks(String(cocok.jumlahPertemuan));
      setGraceTeks(String(cocok.graceMenit));
      setDendaTeks(String(cocok.dendaNominal));
      setSyncedFromCourse(cocok.mataKuliah);
    } else {
      setSyncedFromCourse(null);
    }
  };

  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setSelectedAsprakIds([]);
    setSelectedPraktikanIds([]);
    setCariAsprak('');
    setCariPraktikan('');
    setDropdownOpen(false);
    setCobaSimpan(false);
    setMenyimpan(false);
    setGalatSimpan(null);
    setSyncedFromCourse(null);

    if (initialLab) {
      setNamaKelas(initialLab.nama);
      setMataKuliah(initialLab.mataKuliah ?? '');
      setPertemuanTeks(
        typeof initialLab.jumlahPertemuan === 'number'
          ? String(initialLab.jumlahPertemuan)
          : String(DEFAULT_JUMLAH_PERTEMUAN),
      );
      setRadiusTeks(
        Number.isFinite(initialLab.radius)
          ? String(initialLab.radius)
          : String(DEFAULT_RADIUS_LAB),
      );
      setGraceTeks(
        typeof initialLab.graceMenit === 'number'
          ? String(initialLab.graceMenit)
          : String(DEFAULT_GRACE_MENIT),
      );
      setDendaTeks(
        typeof initialLab.dendaNominal === 'number'
          ? String(initialLab.dendaNominal)
          : String(DEFAULT_DENDA_NOMINAL),
      );

      const matchedRoom = roomOptions.find(
        (r) =>
          r.namaRuang.toLowerCase() ===
            (initialLab.ruanganLab ?? initialLab.nama).trim().toLowerCase() ||
          r.alamat.toLowerCase() === initialLab.alamat.trim().toLowerCase(),
      );
      if (matchedRoom) {
        terapkanRuangan(matchedRoom, false);
      } else {
        setSelectedRoomId(initialLab.id);
        setRuanganLab(initialLab.ruanganLab ?? initialLab.nama);
        setAlamat(initialLab.alamat);
        setTitik(
          Number.isFinite(initialLab.lat) && Number.isFinite(initialLab.lng)
            ? { lat: initialLab.lat, lng: initialLab.lng }
            : {
                lat: REGION_KAMPUS_FSM.latitude,
                lng: REGION_KAMPUS_FSM.longitude,
              },
        );
      }
    } else {
      setNamaKelas('');
      setMataKuliah('');
      setPertemuanTeks(String(DEFAULT_JUMLAH_PERTEMUAN));
      setGraceTeks(String(DEFAULT_GRACE_MENIT));
      setDendaTeks(String(DEFAULT_DENDA_NOMINAL));
      if (roomOptions.length > 0) {
        terapkanRuangan(roomOptions[0], true);
      } else {
        setSelectedRoomId('');
        setRuanganLab('');
        setAlamat('');
        setTitik({
          lat: REGION_KAMPUS_FSM.latitude,
          lng: REGION_KAMPUS_FSM.longitude,
        });
        setRadiusTeks(String(DEFAULT_RADIUS_LAB));
      }
    }
  }, [visible, initialLab, roomOptions]);

  const hasilValidasi = useMemo(
    () =>
      validasiFormLab({
        nama: namaKelas,
        mataKuliah,
        alamat,
        titik,
        radiusTeks,
        graceTeks,
        dendaTeks,
        pertemuanTeks,
      }),
    [
      namaKelas,
      mataKuliah,
      alamat,
      titik,
      radiusTeks,
      graceTeks,
      dendaTeks,
      pertemuanTeks,
    ],
  );

  // Filter pencarian Asprak & Praktikan
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

  // Cegah akun/NIM yang sudah dipilih sebagai Asprak di Step 01 masuk ke daftar Praktikan
  const asprakNimsSelected = useMemo(() => {
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
      if (u.nim?.trim() && asprakNimsSelected.has(u.nim.trim())) return false;
      if (!q) return true;
      return (
        u.nama.toLowerCase().includes(q) ||
        (u.nim ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [poolPraktikan, cariPraktikan, selectedAsprakIds, asprakNimsSelected]);

  const selectedAsprakUsers = useMemo(
    () =>
      selectedAsprakIds
        .map((id) => poolAsprak.find((u) => u.id === id))
        .filter((u): u is User => Boolean(u)),
    [selectedAsprakIds, poolAsprak],
  );

  const selectedPraktikanUsers = useMemo(
    () =>
      selectedPraktikanIds
        .map((id) => poolPraktikan.find((u) => u.id === id))
        .filter((u): u is User => Boolean(u)),
    [selectedPraktikanIds, poolPraktikan],
  );

  const toggleAsprak = (user: User) => {
    setSelectedAsprakIds((prev) => {
      if (prev.includes(user.id)) {
        return prev.filter((id) => id !== user.id);
      }
      if (prev.length >= 2) {
        showToast(t('asprakMaxReached'));
        return prev;
      }
      // Bersihkan dari praktikan bila kebetulan NIM sama
      if (user.nim?.trim()) {
        setSelectedPraktikanIds((pPrev) =>
          pPrev.filter((pid) => {
            const pu = poolPraktikan.find((x) => x.id === pid);
            return pu?.nim?.trim() !== user.nim?.trim();
          }),
        );
      }
      return [...prev, user.id];
    });
  };

  const togglePraktikan = (user: User) => {
    setSelectedPraktikanIds((prev) =>
      prev.includes(user.id)
        ? prev.filter((id) => id !== user.id)
        : [...prev, user.id],
    );
  };

  const handleSelectAllPraktikan = () => {
    setSelectedPraktikanIds((prev) => {
      const next = new Set(prev);
      for (const u of filteredPraktikan) next.add(u.id);
      return Array.from(next);
    });
  };

  // Validasi per langkah untuk tombol Lanjut
  const errorLangkahAktif = useMemo(() => {
    if (isEdit) return hasilValidasi.errors;
    if (step === 3) {
      return hasilValidasi.errors.filter(
        (e) =>
          e === 'valMkKosong' ||
          e === 'valNamaKosong' ||
          e === 'valPertemuanInvalid',
      );
    }
    if (step === 4) {
      return hasilValidasi.errors.filter(
        (e) =>
          e === 'valAlamatKosong' ||
          e === 'valTitikKosong' ||
          e === 'valKoordinatInvalid' ||
          e === 'valRadiusInvalid' ||
          e === 'valGraceInvalid' ||
          e === 'valDendaInvalid',
      );
    }
    return [];
  }, [isEdit, step, hasilValidasi.errors]);

  const handleNextStep = () => {
    if (step === 3 || step === 4) {
      if (errorLangkahAktif.length > 0) {
        setCobaSimpan(true);
        return;
      }
    }
    setCobaSimpan(false);
    setStep((prev) => (prev < 5 ? ((prev + 1) as StepNumber) : prev));
  };

  const handlePrevStep = () => {
    setCobaSimpan(false);
    setStep((prev) => (prev > 1 ? ((prev - 1) as StepNumber) : prev));
  };

  const sinkronAturanMatkulLain = async (
    excludeLabId: string,
    mk: string,
    jumlahPertemuan: number,
    graceMenit: number,
    dendaNominal: number,
  ) => {
    const key = mk.trim().toLowerCase();
    if (!key) return;
    const seMatkul = labs.filter(
      (l) =>
        l.id !== excludeLabId &&
        (l.mataKuliah ?? '').trim().toLowerCase() === key,
    );
    await Promise.all(
      seMatkul.map((lain) =>
        updateLab(lain.id, {
          lat: lain.lat,
          lng: lain.lng,
          radius: lain.radius,
          jumlahPertemuan,
          graceMenit,
          dendaNominal,
        } as Parameters<typeof updateLab>[1]),
      ),
    );
  };

  const handleSimpan = async () => {
    setCobaSimpan(true);
    setGalatSimpan(null);
    if (hasilValidasi.errors.length > 0 || !titik || menyimpan) return;

    setMenyimpan(true);
    try {
      const mkBersih = mataKuliah.trim();
      const namaBersih = namaKelas.trim();
      const alamatBersih = alamat.trim();
      const ruangBersih = ruanganLab.trim() || namaBersih;

      if (isEdit && initialLab) {
        const payloadUpdate = {
          nama: namaBersih,
          mataKuliah: mkBersih,
          ruanganLab: ruangBersih,
          jumlahPertemuan: hasilValidasi.jumlahPertemuan,
          alamat: alamatBersih,
          lat: titik.lat,
          lng: titik.lng,
          radius: hasilValidasi.radius,
          graceMenit: hasilValidasi.graceMenit,
          dendaNominal: hasilValidasi.dendaNominal,
        };
        const ok = await updateLab(
          initialLab.id,
          payloadUpdate as Parameters<typeof updateLab>[1],
        );
        if (!ok) {
          setGalatSimpan(t('stubNotReady'));
          return;
        }
        await sinkronAturanMatkulLain(
          initialLab.id,
          mkBersih,
          hasilValidasi.jumlahPertemuan,
          hasilValidasi.graceMenit,
          hasilValidasi.dendaNominal,
        );
        showToast(t('labUpdatedToast'));
        onClose();
        return;
      }

      const res = await createLab({
        nama: namaBersih,
        mataKuliah: mkBersih,
        ruanganLab: ruangBersih,
        jumlahPertemuan: hasilValidasi.jumlahPertemuan,
        alamat: alamatBersih,
        lat: titik.lat,
        lng: titik.lng,
        radius: hasilValidasi.radius,
        graceMenit: hasilValidasi.graceMenit,
        dendaNominal: hasilValidasi.dendaNominal,
        aslabId: currentUser?.id,
      });

      if (!res.ok) {
        setGalatSimpan(
          res.alasan === 'BELUM_TERSEDIA' ? t('stubNotReady') : res.alasan,
        );
        return;
      }

      // Sinkronkan aturan seragam ke kelas lain dengan mata kuliah sama
      await sinkronAturanMatkulLain(
        res.labId,
        mkBersih,
        hasilValidasi.jumlahPertemuan,
        hasilValidasi.graceMenit,
        hasilValidasi.dendaNominal,
      );

      // Simpan plotting Asprak (Step 01) & Praktikan (Step 02)
      let asprakSaved = 0;
      let praktikanSaved = 0;

      if (selectedAsprakUsers.length > 0) {
        const bulkA = await addAnggotaBulk(
          res.labId,
          'asprak',
          selectedAsprakUsers.map((u) => ({
            nim: u.nim,
            email: u.email,
          })),
        );
        asprakSaved = bulkA.berhasil;
      }

      if (selectedPraktikanUsers.length > 0) {
        const bulkP = await addAnggotaBulk(
          res.labId,
          'praktikan',
          selectedPraktikanUsers.map((u) => ({
            nim: u.nim,
            email: u.email,
          })),
        );
        praktikanSaved = bulkP.berhasil;
      }

      if (asprakSaved > 0 || praktikanSaved > 0) {
        showToast(
          t('labCreatedWithMembersToast', {
            asprak: asprakSaved,
            praktikan: praktikanSaved,
          }),
        );
      } else {
        showToast(t('labCreatedToast'));
      }
      onClose();
    } finally {
      setMenyimpan(false);
    }
  };

  const stepsMeta: { num: StepNumber; label: string }[] = [
    { num: 1, label: t('stepAsprak') },
    { num: 2, label: t('stepPraktikan') },
    { num: 3, label: t('stepKelas') },
    { num: 4, label: t('stepLokasi') },
    { num: 5, label: t('stepTinjau') },
  ];

  // Bagian Dropdown Lokasi Ruangan + Radius + Aturan Seragam (dipakai di Step 04 dan Mode Edit)
  const renderLokasiDanAturan = () => (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('fieldSelectLabDb')}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={menyimpan}
          onPress={() => setDropdownOpen((v) => !v)}
          style={({ pressed }) => [
            styles.dropdownTrigger,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.dropdownTriggerCopy}>
            <Text style={styles.dropdownValue} numberOfLines={1}>
              {ruanganLab || t('fieldSelectLabDb')}
            </Text>
            {alamat ? (
              <Text style={styles.dropdownSub} numberOfLines={1}>
                {alamat}
              </Text>
            ) : null}
          </View>
          {dropdownOpen ? (
            <ChevronUp size={18} color={themeColors.textMuted} />
          ) : (
            <ChevronDown size={18} color={themeColors.textMuted} />
          )}
        </Pressable>

        {dropdownOpen ? (
          <View style={styles.dropdownMenu}>
            {roomOptions.map((room) => {
              const selected = selectedRoomId === room.id;
              return (
                <Pressable
                  key={room.id}
                  accessibilityRole="button"
                  onPress={() => {
                    terapkanRuangan(room, true);
                    setDropdownOpen(false);
                    setGalatSimpan(null);
                  }}
                  style={({ pressed }) => [
                    styles.dropdownOption,
                    selected && styles.dropdownOptionActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.dropdownOptionCopy}>
                    <Text style={styles.dropdownOptionTitle}>
                      {room.namaRuang}
                    </Text>
                    <Text style={styles.dropdownOptionSub} numberOfLines={1}>
                      {room.alamat}
                    </Text>
                  </View>
                  {selected ? (
                    <Check size={16} color={themeColors.sesiDibukaFg} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Ringkasan lokasi ruangan terpilih (read-only dari database) */}
      {ruanganLab ? (
        <View style={styles.dbSummaryCard}>
          <View style={styles.dbSummaryRow}>
            <MapPin size={14} color={themeColors.sesiDibukaFg} />
            <Text style={styles.dbSummaryKicker}>{t('dbLocationSummary')}</Text>
          </View>
          <Text style={styles.dbSummaryName}>{ruanganLab}</Text>
          <Text style={styles.dbSummaryAddr}>{alamat}</Text>
          {titik ? (
            <Text style={styles.dbSummaryCoord}>
              {titik.lat.toFixed(6)}, {titik.lng.toFixed(6)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Radius Presensi */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('fieldRadiusShort')}</Text>
        <View style={styles.radiusInputBox}>
          <TextInput
            value={radiusTeks}
            onChangeText={(txt) => {
              setRadiusTeks(txt.replace(/[^\d.]/g, ''));
              if (galatSimpan) setGalatSimpan(null);
            }}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor={themeColors.textMuted}
            editable={!menyimpan}
            style={styles.radiusTextInput}
          />
          <Text style={styles.radiusUnit}>m</Text>
        </View>
        <Text style={styles.hint}>{t('hintRadiusShort')}</Text>
      </View>

      {/* Info aturan seragam mata kuliah */}
      {mataKuliah.trim() ? (
        <View style={styles.uniformNoticeBox}>
          <Info size={15} color={themeColors.sesiDibukaFg} />
          <Text style={styles.uniformNoticeText}>
            {t('uniformRuleNotice', { mk: mataKuliah.trim() })}
          </Text>
        </View>
      ) : null}

      {/* Grace period & Nominal Denda */}
      <View style={styles.twoCol}>
        <View style={styles.colItem}>
          <Text style={styles.label}>{t('fieldGrace')}</Text>
          <TextInput
            value={graceTeks}
            onChangeText={(txt) => {
              setGraceTeks(txt.replace(/[^\d]/g, ''));
              if (galatSimpan) setGalatSimpan(null);
            }}
            keyboardType="number-pad"
            placeholder="15"
            placeholderTextColor={themeColors.textMuted}
            editable={!menyimpan}
            style={styles.input}
          />
          <Text style={styles.hint}>{t('hintGrace')}</Text>
        </View>

        <View style={styles.colItem}>
          <Text style={styles.label}>{t('fieldDenda')}</Text>
          <TextInput
            value={dendaTeks}
            onChangeText={(txt) => {
              setDendaTeks(txt.replace(/[^\d]/g, ''));
              if (galatSimpan) setGalatSimpan(null);
            }}
            keyboardType="number-pad"
            placeholder="5000"
            placeholderTextColor={themeColors.textMuted}
            editable={!menyimpan}
            style={styles.input}
          />
          <Text style={styles.hint}>{t('hintDenda')}</Text>
        </View>
      </View>
    </>
  );

  // Bagian Mata Kuliah, Nama Kelas & Jumlah Pertemuan (dipakai di Step 03 dan Mode Edit)
  const renderMatkulDanKelas = () => (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('fieldMataKuliah')}</Text>
        <TextInput
          value={mataKuliah}
          onChangeText={(txt) => {
            terapkanAturanMatkul(txt);
            if (galatSimpan) setGalatSimpan(null);
          }}
          placeholder={t('placeholderMataKuliah')}
          placeholderTextColor={themeColors.textMuted}
          editable={!menyimpan}
          style={styles.input}
        />

        {existingCourses.length > 0 ? (
          <View style={styles.courseSuggestWrap}>
            <Text style={styles.hint}>{t('existingCoursesHint')}</Text>
            <View style={styles.chipWrap}>
              {existingCourses.map((c) => {
                const aktif =
                  mataKuliah.trim().toLowerCase() ===
                  c.mataKuliah.trim().toLowerCase();
                return (
                  <Pressable
                    key={c.mataKuliah}
                    accessibilityRole="button"
                    onPress={() => terapkanAturanMatkul(c.mataKuliah)}
                    style={[
                      styles.courseChip,
                      aktif && styles.courseChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.courseChipText,
                        aktif && styles.courseChipTextActive,
                      ]}
                    >
                      {c.mataKuliah}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {syncedFromCourse ? (
          <View style={styles.syncedPill}>
            <Check size={13} color={themeColors.sesiDibukaFg} />
            <Text style={styles.syncedPillText}>
              {t('uniformRuleSynced', { mk: syncedFromCourse })}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('fieldNamaLab')}</Text>
        <TextInput
          value={namaKelas}
          onChangeText={(txt) => {
            setNamaKelas(txt);
            if (galatSimpan) setGalatSimpan(null);
          }}
          placeholder={t('placeholderNamaLab')}
          placeholderTextColor={themeColors.textMuted}
          editable={!menyimpan}
          style={styles.input}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('fieldJumlahPertemuan')}</Text>
        <TextInput
          value={pertemuanTeks}
          onChangeText={(txt) => {
            setPertemuanTeks(txt.replace(/[^\d]/g, ''));
            if (galatSimpan) setGalatSimpan(null);
          }}
          keyboardType="number-pad"
          placeholder="8"
          placeholderTextColor={themeColors.textMuted}
          editable={!menyimpan}
          style={styles.input}
        />
        <Text style={styles.hint}>{t('hintJumlahPertemuan')}</Text>
      </View>
    </>
  );

  // Cek apakah praktikan sudah terdaftar pada mata kuliah yang sama (bila mata kuliah sudah diisi)
  const isPraktikanSudahDiMk = (uid: string) => {
    const mk = mataKuliah.trim().toLowerCase();
    if (!mk) return false;
    return keanggotaanLab.some(
      (k) =>
        k.uid === uid &&
        k.peran === 'praktikan' &&
        (k.mataKuliah ?? '').trim().toLowerCase() === mk,
    );
  };

  return (
    <SheetModal
      visible={visible}
      kicker={isEdit ? t('formEditKicker') : t('formAddKicker')}
      judul={isEdit ? t('formEditTitle') : t('formAddTitle')}
      dismissible={!menyimpan}
      onClose={onClose}
      footer={
        isEdit ? (
          <View style={styles.footerRow}>
            <Tombol
              variant="sekunder"
              disabled={menyimpan}
              onPress={onClose}
              style={styles.cancelBtn}
            >
              {t('cancel')}
            </Tombol>
            <Tombol
              variant="primer"
              loading={menyimpan}
              disabled={menyimpan}
              onPress={handleSimpan}
              style={styles.submitBtn}
            >
              {menyimpan ? t('saving') : t('saveChanges')}
            </Tombol>
          </View>
        ) : (
          <View style={styles.footerRow}>
            <Tombol
              variant="sekunder"
              disabled={menyimpan}
              onPress={step === 1 ? onClose : handlePrevStep}
              style={styles.cancelBtn}
            >
              {step === 1 ? t('cancel') : t('stepBack')}
            </Tombol>
            {step < 5 ? (
              <Tombol
                variant="primer"
                disabled={menyimpan}
                onPress={handleNextStep}
                style={styles.submitBtn}
              >
                {t('stepNext')} →
              </Tombol>
            ) : (
              <Tombol
                variant="primer"
                loading={menyimpan}
                disabled={menyimpan}
                onPress={handleSimpan}
                style={styles.submitBtn}
              >
                {menyimpan ? t('saving') : t('saveLab')}
              </Tombol>
            )}
          </View>
        )
      }
    >
      {/* Diagram Alur 5 Langkah Horizontal (01 —•— 02 —•— 03 —•— 04 —•— 05) */}
      {!isEdit ? (
        <View style={styles.stepperWrap}>
          <View style={styles.stepperRow}>
            {stepsMeta.map((item, idx) => {
              const aktif = step === item.num;
              const selesai = step > item.num;
              const accent = STEP_COLORS[item.num];
              return (
                <React.Fragment key={item.num}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      if (item.num <= step) {
                        setCobaSimpan(false);
                        setStep(item.num);
                      }
                    }}
                    style={styles.stepNodeCol}
                  >
                    <View
                      style={[
                        styles.stepOuterRing,
                        (aktif || selesai) && { borderColor: accent },
                      ]}
                    >
                      <View
                        style={[
                          styles.stepCircle,
                          aktif || selesai
                            ? { backgroundColor: accent }
                            : styles.stepCircleIdle,
                        ]}
                      >
                        {selesai ? (
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                          <Text
                            style={[
                              styles.stepNumberText,
                              (aktif || selesai) && styles.stepNumberTextActive,
                            ]}
                          >
                            {`0${item.num}`}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        aktif && { color: accent, fontFamily: fontFamily.bold },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Pressable>

                  {idx < stepsMeta.length - 1 ? (
                    <View style={styles.stepConnectorWrap}>
                      <View style={styles.stepLine} />
                      <View
                        style={[
                          styles.stepDot,
                          step > item.num && {
                            backgroundColor: STEP_COLORS[item.num],
                          },
                        ]}
                      />
                      <View style={styles.stepLine} />
                    </View>
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* MODE EDIT: langsung tampilkan form kelas + lokasi dropdown + aturan seragam */}
      {isEdit ? (
        <>
          {renderMatkulDanKelas()}
          {renderLokasiDanAturan()}
        </>
      ) : null}

      {/* STEP 01: Plotting 2 Asisten Praktikum (Asprak) */}
      {!isEdit && step === 1 ? (
        <View style={styles.stepBody}>
          <View style={styles.stepHeaderBox}>
            <Text style={styles.stepHeading}>{t('step1Heading')}</Text>
            <Text style={styles.stepDesc}>{t('step1Desc')}</Text>
          </View>

          <View style={styles.counterRow}>
            <View style={styles.counterBadge}>
              <UserCheck size={14} color={themeColors.sesiDibukaFg} />
              <Text style={styles.counterBadgeText}>
                {t('asprakSelectedCounter', {
                  count: selectedAsprakIds.length,
                })}
              </Text>
            </View>
          </View>

          {selectedAsprakIds.length > 0 && selectedAsprakIds.length < 2 ? (
            <View style={styles.warnBox}>
              <AlertTriangle size={14} color={themeColors.gpsOffFg} />
              <Text style={styles.warnText}>
                {t('asprakNeedTwoWarn', { count: selectedAsprakIds.length })}
              </Text>
            </View>
          ) : null}

          <View style={styles.searchBox}>
            <Search size={15} color={themeColors.textMuted} />
            <TextInput
              value={cariAsprak}
              onChangeText={setCariAsprak}
              placeholder={t('searchAsprakPlaceholder')}
              placeholderTextColor={themeColors.textMuted}
              style={styles.searchInput}
            />
          </View>

          {filteredAsprak.length === 0 ? (
            <View style={styles.emptyPoolBox}>
              <Text style={styles.emptyPoolText}>{t('asprakEmptyPool')}</Text>
            </View>
          ) : (
            <View style={styles.memberList}>
              {filteredAsprak.map((u) => {
                const selected = selectedAsprakIds.includes(u.id);
                return (
                  <Pressable
                    key={u.id}
                    accessibilityRole="button"
                    onPress={() => toggleAsprak(u)}
                    style={({ pressed }) => [
                      styles.memberRow,
                      selected && styles.memberRowActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.memberCopy}>
                      <Text style={styles.memberName}>{u.nama}</Text>
                      <Text style={styles.memberMeta} numberOfLines={1}>
                        {[u.nim, u.email].filter(Boolean).join(' · ') || u.id}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkBox,
                        selected && styles.checkBoxActive,
                      ]}
                    >
                      {selected ? (
                        <Check size={13} color={themeColors.onPrimary} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      {/* STEP 02: Plotting Seluruh Praktikan yang Diampu 2 Asprak */}
      {!isEdit && step === 2 ? (
        <View style={styles.stepBody}>
          <View style={styles.stepHeaderBox}>
            <Text style={styles.stepHeading}>{t('step2Heading')}</Text>
            <Text style={styles.stepDesc}>{t('step2Desc')}</Text>
          </View>

          <View style={styles.asprakContextCard}>
            <UserCheck size={14} color={themeColors.sesiDibukaFg} />
            <Text style={styles.asprakContextText}>
              {selectedAsprakUsers.length > 0
                ? t('handledByAsprak', {
                    names: selectedAsprakUsers.map((a) => a.nama).join(' & '),
                  })
                : t('handledByAsprakNone')}
            </Text>
          </View>

          <View style={styles.counterRow}>
            <View style={styles.counterBadge}>
              <Users size={14} color={themeColors.sesiDibukaFg} />
              <Text style={styles.counterBadgeText}>
                {t('praktikanSelectedCounter', {
                  count: selectedPraktikanIds.length,
                })}
              </Text>
            </View>
            <View style={styles.inlineActions}>
              {filteredPraktikan.length > 0 ? (
                <Pressable onPress={handleSelectAllPraktikan}>
                  <Text style={styles.inlineActionLink}>
                    {t('selectAllVisible')}
                  </Text>
                </Pressable>
              ) : null}
              {selectedPraktikanIds.length > 0 ? (
                <Pressable onPress={() => setSelectedPraktikanIds([])}>
                  <Text style={styles.inlineActionDanger}>
                    {t('clearSelection')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.searchBox}>
            <Search size={15} color={themeColors.textMuted} />
            <TextInput
              value={cariPraktikan}
              onChangeText={setCariPraktikan}
              placeholder={t('searchPraktikanPlaceholder')}
              placeholderTextColor={themeColors.textMuted}
              style={styles.searchInput}
            />
          </View>

          {filteredPraktikan.length === 0 ? (
            <View style={styles.emptyPoolBox}>
              <Text style={styles.emptyPoolText}>
                {t('praktikanEmptyPool')}
              </Text>
            </View>
          ) : (
            <View style={styles.memberList}>
              {filteredPraktikan.map((u) => {
                const selected = selectedPraktikanIds.includes(u.id);
                const sudahDiMk = isPraktikanSudahDiMk(u.id);
                return (
                  <Pressable
                    key={u.id}
                    accessibilityRole="button"
                    disabled={sudahDiMk}
                    onPress={() => togglePraktikan(u)}
                    style={({ pressed }) => [
                      styles.memberRow,
                      selected && styles.memberRowActive,
                      sudahDiMk && styles.memberRowDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.memberCopy}>
                      <Text style={styles.memberName}>{u.nama}</Text>
                      <Text style={styles.memberMeta} numberOfLines={1}>
                        {[u.nim, u.kelas, u.email]
                          .filter(Boolean)
                          .join(' · ') || u.id}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkBox,
                        selected && styles.checkBoxActive,
                      ]}
                    >
                      {selected ? (
                        <Check size={13} color={themeColors.onPrimary} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      {/* STEP 03: Mata Kuliah Besar, Nama Kelas Praktikum & Jumlah Pertemuan */}
      {!isEdit && step === 3 ? (
        <View style={styles.stepBody}>
          <View style={styles.stepHeaderBox}>
            <Text style={styles.stepHeading}>{t('step3Heading')}</Text>
            <Text style={styles.stepDesc}>{t('step3Desc')}</Text>
          </View>
          {renderMatkulDanKelas()}
        </View>
      ) : null}

      {/* STEP 04: Lokasi Ruangan Lab (Dropdown) + Radius & Aturan Seragam */}
      {!isEdit && step === 4 ? (
        <View style={styles.stepBody}>
          <View style={styles.stepHeaderBox}>
            <Text style={styles.stepHeading}>{t('step4Heading')}</Text>
            <Text style={styles.stepDesc}>{t('step4Desc')}</Text>
          </View>
          {renderLokasiDanAturan()}
        </View>
      ) : null}

      {/* STEP 05: Ringkasan & Konfirmasi Simpan */}
      {!isEdit && step === 5 ? (
        <View style={styles.stepBody}>
          <View style={styles.stepHeaderBox}>
            <Text style={styles.stepHeading}>{t('step5Heading')}</Text>
            <Text style={styles.stepDesc}>{t('step5Desc')}</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryBlock}>
              <View style={styles.summaryRowTitle}>
                <BookOpen size={14} color={themeColors.sesiDibukaFg} />
                <Text style={styles.summaryKicker}>
                  {t('summaryCourseClass')}
                </Text>
              </View>
              <Text style={styles.summaryMain}>
                {mataKuliah.trim()} — {namaKelas.trim()}
              </Text>
              <Text style={styles.summarySub}>
                {t('meetingsBadge', { count: hasilValidasi.jumlahPertemuan })}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBlock}>
              <View style={styles.summaryRowTitle}>
                <Building2 size={14} color={themeColors.sesiDibukaFg} />
                <Text style={styles.summaryKicker}>
                  {t('summaryRoomRadius')}
                </Text>
              </View>
              <Text style={styles.summaryMain}>
                {ruanganLab} ·{' '}
                {t('radiusBadge', { meter: hasilValidasi.radius })}
              </Text>
              <Text style={styles.summarySub}>{alamat}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBlock}>
              <View style={styles.summaryRowTitle}>
                <Info size={14} color={themeColors.sesiDibukaFg} />
                <Text style={styles.summaryKicker}>{t('summaryRules')}</Text>
              </View>
              <Text style={styles.summaryMain}>
                {t('graceBadge', { menit: hasilValidasi.graceMenit })} ·{' '}
                {t('fineBadge', {
                  nominal: hasilValidasi.dendaNominal.toLocaleString('id-ID'),
                })}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBlock}>
              <View style={styles.summaryRowTitle}>
                <UserCheck size={14} color={themeColors.sesiDibukaFg} />
                <Text style={styles.summaryKicker}>
                  {t('summaryAsprak', { count: selectedAsprakUsers.length })}
                </Text>
              </View>
              <Text style={styles.summarySub}>
                {selectedAsprakUsers.length > 0
                  ? selectedAsprakUsers.map((u) => u.nama).join(', ')
                  : t('summaryNone')}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBlock}>
              <View style={styles.summaryRowTitle}>
                <Users size={14} color={themeColors.sesiDibukaFg} />
                <Text style={styles.summaryKicker}>
                  {t('summaryPraktikan', {
                    count: selectedPraktikanUsers.length,
                  })}
                </Text>
              </View>
              <Text style={styles.summarySub}>
                {selectedPraktikanUsers.length > 0
                  ? selectedPraktikanUsers
                      .slice(0, 5)
                      .map((u) => u.nama)
                      .join(', ') +
                    (selectedPraktikanUsers.length > 5
                      ? ` +${selectedPraktikanUsers.length - 5}`
                      : '')
                  : t('summaryNone')}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Pesan Validasi */}
      {cobaSimpan && errorLangkahAktif.length > 0 ? (
        <View style={styles.errorBox}>
          <AlertTriangle size={15} color={themeColors.errorFg} />
          <View style={styles.errorList}>
            {errorLangkahAktif.map((kode) => (
              <Text key={kode} style={styles.errorText}>
                • {t(kode)}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {galatSimpan ? (
        <View style={styles.errorBox}>
          <AlertTriangle size={15} color={themeColors.errorFg} />
          <Text style={styles.errorText}>{galatSimpan}</Text>
        </View>
      ) : null}
    </SheetModal>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    stepperWrap: {
      paddingVertical: spacing.s2,
      marginBottom: spacing.s3,
      borderBottomWidth: 1,
      borderBottomColor: w.border,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    stepNodeCol: {
      alignItems: 'center',
      gap: 4,
      width: 48,
    },
    stepOuterRing: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: w.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: w.surface,
    },
    stepCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCircleIdle: {
      backgroundColor: w.surfaceMuted,
    },
    stepNumberText: {
      fontSize: 11,
      fontFamily: fontFamily.bold,
      color: w.textMuted,
    },
    stepNumberTextActive: {
      color: '#FFFFFF',
    },
    stepLabel: {
      fontSize: 10,
      fontFamily: fontFamily.medium,
      color: w.textMuted,
      textAlign: 'center',
    },
    stepConnectorWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 17,
    },
    stepLine: {
      flex: 1,
      height: 1.5,
      backgroundColor: w.border,
    },
    stepDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: w.textMuted,
    },
    stepBody: {
      gap: spacing.s3,
    },
    stepHeaderBox: {
      gap: 4,
    },
    stepHeading: {
      ...type.body,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    stepDesc: {
      ...type.caption,
      color: w.textSecondary,
      lineHeight: 18,
    },
    counterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s2,
      flexWrap: 'wrap',
    },
    counterBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      backgroundColor: w.sesiDibukaBg,
      borderWidth: 1,
      borderColor: w.radiusInsideBorder,
    },
    counterBadgeText: {
      ...type.caption,
      fontFamily: fontFamily.bold,
      color: w.sesiDibukaFg,
    },
    inlineActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s3,
    },
    inlineActionLink: {
      ...type.caption,
      fontFamily: fontFamily.bold,
      color: w.sesiDibukaFg,
    },
    inlineActionDanger: {
      ...type.caption,
      fontFamily: fontFamily.semibold,
      color: w.errorFg,
    },
    asprakContextCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
      paddingHorizontal: spacing.s3,
      paddingVertical: spacing.s2,
      borderRadius: radius.button,
      backgroundColor: w.surfaceMuted,
      borderWidth: 1,
      borderColor: w.border,
    },
    asprakContextText: {
      ...type.caption,
      color: w.textPrimary,
      fontFamily: fontFamily.semibold,
      flex: 1,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
      minHeight: 42,
      paddingHorizontal: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
    },
    searchInput: {
      flex: 1,
      ...type.body,
      color: w.textPrimary,
      paddingVertical: 6,
    },
    memberList: {
      gap: spacing.s2,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s2,
      paddingHorizontal: spacing.s3,
      paddingVertical: spacing.s2 + 2,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
    },
    memberRowActive: {
      borderColor: w.radiusInsideBorder,
      backgroundColor: w.sesiDibukaBg,
    },
    memberRowDisabled: {
      opacity: 0.45,
    },
    memberCopy: {
      flex: 1,
      gap: 2,
    },
    memberName: {
      ...type.body,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    memberMeta: {
      ...type.micro,
      color: w.textMuted,
    },
    checkBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: w.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: w.surfaceMuted,
    },
    checkBoxActive: {
      backgroundColor: w.primary,
      borderColor: w.primaryPressed,
    },
    emptyPoolBox: {
      padding: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
    },
    emptyPoolText: {
      ...type.caption,
      color: w.textSecondary,
      lineHeight: 18,
    },
    warnBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
      paddingHorizontal: spacing.s3,
      paddingVertical: spacing.s2,
      borderRadius: radius.button,
      backgroundColor: w.gpsOffBg,
      borderWidth: 1,
      borderColor: w.gpsOffBorder,
    },
    warnText: {
      ...type.caption,
      color: w.gpsOffFg,
      flex: 1,
    },
    fieldGroup: {
      gap: spacing.s1 + 2,
      marginBottom: spacing.s2,
    },
    label: {
      ...type.caption,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    input: {
      minHeight: 44,
      paddingHorizontal: spacing.s3,
      paddingVertical: spacing.s2,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      ...type.body,
      color: w.textPrimary,
    },
    hint: {
      ...type.micro,
      color: w.textMuted,
      lineHeight: 16,
    },
    courseSuggestWrap: {
      gap: 6,
      marginTop: 4,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    courseChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
    },
    courseChipActive: {
      borderColor: w.radiusInsideBorder,
      backgroundColor: w.sesiDibukaBg,
    },
    courseChipText: {
      ...type.micro,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    courseChipTextActive: {
      color: w.sesiDibukaFg,
    },
    syncedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    syncedPillText: {
      ...type.micro,
      color: w.sesiDibukaFg,
      fontFamily: fontFamily.semibold,
      flex: 1,
    },
    dropdownTrigger: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s2,
      paddingHorizontal: spacing.s3,
      paddingVertical: spacing.s2,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
    },
    dropdownTriggerCopy: {
      flex: 1,
      gap: 2,
    },
    dropdownValue: {
      ...type.body,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    dropdownSub: {
      ...type.micro,
      color: w.textMuted,
    },
    dropdownMenu: {
      marginTop: spacing.s1,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      overflow: 'hidden',
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s2,
      paddingHorizontal: spacing.s3,
      paddingVertical: spacing.s2 + 2,
    },
    dropdownOptionActive: {
      backgroundColor: w.sesiDibukaBg,
    },
    dropdownOptionCopy: {
      flex: 1,
      gap: 1,
    },
    dropdownOptionTitle: {
      ...type.body,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    dropdownOptionSub: {
      ...type.micro,
      color: w.textSecondary,
    },
    dbSummaryCard: {
      padding: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      gap: 3,
      marginBottom: spacing.s2,
    },
    dbSummaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dbSummaryKicker: {
      ...type.micro,
      fontFamily: fontFamily.semibold,
      color: w.sesiDibukaFg,
    },
    dbSummaryName: {
      ...type.body,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
      marginTop: 2,
    },
    dbSummaryAddr: {
      ...type.caption,
      color: w.textSecondary,
    },
    dbSummaryCoord: {
      ...type.micro,
      color: w.textMuted,
    },
    radiusInputBox: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
      paddingHorizontal: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
    },
    radiusTextInput: {
      flex: 1,
      ...type.body,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
      paddingVertical: spacing.s2,
    },
    radiusUnit: {
      ...type.caption,
      fontFamily: fontFamily.bold,
      color: w.textMuted,
    },
    uniformNoticeBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.s2,
      padding: spacing.s3,
      borderRadius: radius.button,
      backgroundColor: w.sesiDibukaBg,
      borderWidth: 1,
      borderColor: w.radiusInsideBorder,
      marginBottom: spacing.s2,
    },
    uniformNoticeText: {
      ...type.caption,
      color: w.sesiDibukaFg,
      flex: 1,
      lineHeight: 18,
    },
    twoCol: {
      flexDirection: 'row',
      gap: spacing.s3,
      marginBottom: spacing.s2,
    },
    colItem: {
      flex: 1,
      gap: spacing.s1 + 2,
    },
    summaryCard: {
      padding: spacing.s3 + 2,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      gap: spacing.s2 + 2,
    },
    summaryBlock: {
      gap: 3,
    },
    summaryRowTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    summaryKicker: {
      ...type.micro,
      fontFamily: fontFamily.bold,
      color: w.textMuted,
      letterSpacing: 0.4,
    },
    summaryMain: {
      ...type.body,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    summarySub: {
      ...type.caption,
      color: w.textSecondary,
      lineHeight: 18,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: w.border,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.s2,
      padding: spacing.s3,
      borderRadius: radius.button,
      backgroundColor: w.errorBg,
      borderWidth: 1,
      borderColor: w.dangerBorder,
      marginTop: spacing.s2,
    },
    errorList: {
      flex: 1,
      gap: 2,
    },
    errorText: {
      ...type.caption,
      color: w.errorFg,
      flex: 1,
    },
    footerRow: {
      flexDirection: 'row',
      gap: spacing.s2,
    },
    cancelBtn: {
      flex: 1,
    },
    submitBtn: {
      flex: 1.4,
    },
    pressed: {
      opacity: 0.85,
    },
  });
