import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
} from 'lucide-react-native';

import {
  ConfirmDialogModal,
  DropdownSelect,
} from '@/components/aslab/lab/AslabUi';
import {
  DAFTAR_HARI_EN,
  DAFTAR_HARI_ID,
  formatYmd,
  hariIniYmd,
  parseYmd,
  useAslabStore,
  type IndeksHari,
  type SesiPertemuan,
} from '@/components/aslab/lab/aslabStore';
import { useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import {
  darkColors,
  fontFamily,
  layout,
  radius,
  spacing,
  type as tipe,
  type ThemeColors,
} from '@/theme/tokens';

type ModeKalender = 'harian' | 'mingguan' | 'bulanan';

const JAM_MULAI_GRID = 7;
const JAM_AKHIR_GRID = 18;
const TINGGI_PER_JAM = 74;
const LEBAR_KOLOM_MINGGU = 144;
const RE_YMD = /^\d{4}-\d{2}-\d{2}$/;
const RE_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

const BULAN_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const BULAN_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const BULAN_SINGKAT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];
const BULAN_SINGKAT_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const PALET_PASTEL_TERANG = [
  { bg: '#DDF2FD', border: '#BAE6FD', fg: '#0C4A6E', sub: '#0369A1' },
  { bg: '#FCE7F3', border: '#FBCFE8', fg: '#831843', sub: '#9D174D' },
  { bg: '#FFEDD5', border: '#FED7AA', fg: '#7C2D12', sub: '#9A3412' },
  { bg: '#EDE9FE', border: '#DDD6FE', fg: '#4C1D95', sub: '#5B21B6' },
  { bg: '#DCFCE7', border: '#BBF7D0', fg: '#14532D', sub: '#166534' },
];

const PALET_PASTEL_GELAP = [
  { bg: '#132F44', border: '#1E4968', fg: '#E0F2FE', sub: '#7DD3FC' },
  { bg: '#3B192E', border: '#592545', fg: '#FCE7F3', sub: '#F9A8D4' },
  { bg: '#3D2412', border: '#5C371B', fg: '#FFEDD5', sub: '#FDBA74' },
  { bg: '#271D47', border: '#3D2E6E', fg: '#EDE9FE', sub: '#C4B5FD' },
  { bg: '#143322', border: '#1E4D33', fg: '#DCFCE7', sub: '#86EFAC' },
];

function hashWarna(teks: string, isDark: boolean) {
  let h = 0;
  for (let i = 0; i < teks.length; i += 1) {
    h = (h * 31 + teks.charCodeAt(i)) >>> 0;
  }
  const list = isDark ? PALET_PASTEL_GELAP : PALET_PASTEL_TERANG;
  return list[h % list.length];
}

function keMenit(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (Number.isFinite(h) ? h : 8) * 60 + (Number.isFinite(m) ? m : 0);
}

function inisialNama(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? '')
    .join('');
}

function tambahHari(ymd: string, delta: number): string {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + delta);
  return formatYmd(d);
}

function hariMingguSeninSabtu(acuanYmd: string): string[] {
  const d = parseYmd(acuanYmd);
  const day = d.getDay();
  const offsetKeSenin = day === 0 ? -6 : 1 - day;
  const senin = new Date(d);
  senin.setDate(d.getDate() + offsetKeSenin);
  return Array.from({ length: 6 }, (_, i) => {
    const cur = new Date(senin);
    cur.setDate(senin.getDate() + i);
    return formatYmd(cur);
  });
}

/**
 * Tab Jadwal Aslab (Clean View):
 * - Header bulan berada tepat di tengah layar tanpa tombol tambah jadwal.
 * - Ketuk blok sesi yang sudah ada apabila perlu memindahkan jam/tanggal/ruangan.
 */
export default function JadwalAslabScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { showToast } = useToast();
  const { themeColors: tc, language } = usePreferences();
  const isEn = language === 'en';
  const tx = (id: string, en: string) => (isEn ? en : id);
  const isDark = tc.background === darkColors.background;

  const { currentUser, users } = useSession();
  const {
    ruanganLabs,
    keanggotaanAll,
    sesiAll,
    simpanSesiPertemuan,
    hapusSesiPertemuan,
  } = useAslabStore();

  const s = useMemo(() => buatGaya(tc), [tc]);

  const todayStr = hariIniYmd();
  const [mode, setMode] = useState<ModeKalender>('mingguan');
  const [fokusYmd, setFokusYmd] = useState<string>(todayStr);

  // Modal Reschedule Sesi Terpilih
  const [editingSesi, setEditingSesi] = useState<SesiPertemuan | null>(null);
  const [tanggalInput, setTanggalInput] = useState(todayStr);
  const [jamMulaiInput, setJamMulaiInput] = useState('09:40');
  const [jamSelesaiInput, setJamSelesaiInput] = useState('11:40');
  const [ruangIdInput, setRuangIdInput] = useState('');
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const fokusDate = useMemo(() => parseYmd(fokusYmd), [fokusYmd]);
  const mingguYmds = useMemo(
    () => hariMingguSeninSabtu(fokusYmd),
    [fokusYmd],
  );

  const daftarJam = useMemo(
    () =>
      Array.from(
        { length: JAM_AKHIR_GRID - JAM_MULAI_GRID + 1 },
        (_, i) => JAM_MULAI_GRID + i,
      ),
    [],
  );

  const selBulanan = useMemo(() => {
    const y = fokusDate.getFullYear();
    const m = fokusDate.getMonth();
    const tglSatu = new Date(y, m, 1, 12, 0, 0);
    const offsetSenin = (tglSatu.getDay() + 6) % 7;
    const mulai = new Date(y, m, 1 - offsetSenin, 12, 0, 0);
    return Array.from({ length: 35 }, (_, idx) => {
      const cur = new Date(mulai);
      cur.setDate(mulai.getDate() + idx);
      const ymd = formatYmd(cur);
      return {
        ymd,
        tgl: cur.getDate(),
        sebulan: cur.getMonth() === m,
        jmlSesi: sesiAll.filter((x) => x.tanggal === ymd).length,
      };
    });
  }, [fokusDate, sesiAll]);

  const sesiHariFokus = useMemo(
    () => sesiAll.filter((x) => x.tanggal === fokusYmd),
    [sesiAll, fokusYmd],
  );

  if (currentUser && currentUser.peran !== 'aslab') {
    return <Redirect href="/" />;
  }

  const blnSingkat = (m: number) =>
    isEn ? BULAN_SINGKAT_EN[m] : BULAN_SINGKAT_ID[m];
  const namaBulan = isEn
    ? BULAN_EN[fokusDate.getMonth()]
    : BULAN_ID[fokusDate.getMonth()];

  // Judul tengah dinamis sesuai mode: Harian (tanggal hari itu), Mingguan (rentang awal–akhir minggu), Bulanan (Bulan Tahun)
  const judulPeriodeTengah = (() => {
    if (mode === 'harian') {
      const namaHari = isEn
        ? DAFTAR_HARI_EN[fokusDate.getDay() as IndeksHari]
        : DAFTAR_HARI_ID[fokusDate.getDay() as IndeksHari];
      return `${namaHari}, ${fokusDate.getDate()} ${blnSingkat(fokusDate.getMonth())} ${fokusDate.getFullYear()}`;
    }
    if (mode === 'mingguan') {
      const dAwal = parseYmd(mingguYmds[0]);
      const dAkhir = parseYmd(mingguYmds[mingguYmds.length - 1]);
      if (
        dAwal.getMonth() === dAkhir.getMonth() &&
        dAwal.getFullYear() === dAkhir.getFullYear()
      ) {
        return `${dAwal.getDate()} – ${dAkhir.getDate()} ${blnSingkat(dAkhir.getMonth())} ${dAkhir.getFullYear()}`;
      }
      if (dAwal.getFullYear() === dAkhir.getFullYear()) {
        return `${dAwal.getDate()} ${blnSingkat(dAwal.getMonth())} – ${dAkhir.getDate()} ${blnSingkat(dAkhir.getMonth())} ${dAkhir.getFullYear()}`;
      }
      return `${dAwal.getDate()} ${blnSingkat(dAwal.getMonth())} ${dAwal.getFullYear()} – ${dAkhir.getDate()} ${blnSingkat(dAkhir.getMonth())} ${dAkhir.getFullYear()}`;
    }
    return `${namaBulan} ${fokusDate.getFullYear()}`;
  })();

  // 7 lingkaran hari sekitar fokusYmd untuk navigasi cepat di mode Harian
  const deretan7HariHarian = Array.from({ length: 7 }, (_, idx) =>
    tambahHari(fokusYmd, idx - 3),
  );

  const geserPeriode = (arah: -1 | 1) => {
    if (mode === 'harian') {
      setFokusYmd((prev) => tambahHari(prev, arah));
    } else if (mode === 'mingguan') {
      setFokusYmd((prev) => tambahHari(prev, arah * 7));
    } else {
      const d = parseYmd(fokusYmd);
      d.setMonth(d.getMonth() + arah);
      setFokusYmd(formatYmd(d));
    }
  };

  const bukaModalReschedule = (item: SesiPertemuan) => {
    setEditingSesi(item);
    setTanggalInput(item.tanggal);
    setJamMulaiInput(item.jamMulai);
    setJamSelesaiInput(item.jamSelesai);
    setRuangIdInput(item.labId || ruanganLabs[0]?.id || '');
  };

  const validasiReschedule = () => {
    if (!RE_YMD.test(tanggalInput.trim())) {
      showToast(tx('Format tanggal YYYY-MM-DD.', 'Use YYYY-MM-DD format.'));
      return false;
    }
    if (
      !RE_JAM.test(jamMulaiInput.trim()) ||
      !RE_JAM.test(jamSelesaiInput.trim()) ||
      jamSelesaiInput.trim() <= jamMulaiInput.trim()
    ) {
      showToast(tx('Periksa jam mulai & selesai.', 'Check start & end time.'));
      return false;
    }
    return true;
  };

  const eksekusiSimpanReschedule = async () => {
    if (!editingSesi) return;
    await simpanSesiPertemuan({
      id: editingSesi.id,
      kelasId: editingSesi.kelasId,
      pertemuanKe: editingSesi.pertemuanKe,
      namaPraktikum: editingSesi.namaPraktikum,
      kelas: editingSesi.kelas,
      ruanganLabId: ruangIdInput || ruanganLabs[0]?.id || 'lab-b',
      topik: editingSesi.topik,
      tanggal: tanggalInput.trim(),
      jamMulai: jamMulaiInput.trim(),
      jamSelesai: jamSelesaiInput.trim(),
    });
    setConfirmSaveOpen(false);
    setEditingSesi(null);
    setFokusYmd(tanggalInput.trim());
    showToast(tx('Jadwal diperbarui.', 'Schedule updated.'));
  };

  const handleHapusSesi = async () => {
    if (!editingSesi) return;
    await hapusSesiPertemuan(editingSesi.id);
    setConfirmDeleteOpen(false);
    setEditingSesi(null);
    showToast(tx('Sesi dihapus.', 'Session deleted.'));
  };

  const infoPesertaSesi = (item: SesiPertemuan) => {
    const klsId = item.kelasId;
    const anggota = klsId
      ? keanggotaanAll.filter((k) => k.labId === klsId)
      : [];
    const asprakInitials = anggota
      .filter((a) => a.peran === 'asprak')
      .map((a) => users.find((u) => u.id === a.uid)?.nama)
      .filter((n): n is string => Boolean(n))
      .map(inisialNama);

    if (asprakInitials.length === 0 && item.asistenId) {
      const as = users.find((u) => u.id === item.asistenId);
      if (as) asprakInitials.push(inisialNama(as.nama));
    }
    const jmlPraktikan = anggota.filter((a) => a.peran === 'praktikan').length;
    return { asprakInitials: asprakInitials.slice(0, 3), jmlPraktikan };
  };

  const formatJamLabel = (jam: number) => {
    const suffix = jam >= 12 ? 'PM' : 'AM';
    const h12 = jam % 12 === 0 ? 12 : jam % 12;
    return `${String(h12).padStart(2, '0')} ${suffix}`;
  };

  const lebarKolomHarian = Math.max(240, screenWidth - 24 - 58 - 4);
  const kolomHariAktif = mode === 'harian' ? [fokusYmd] : mingguYmds;

  return (
    <View style={s.root}>
      {/* Header Bulan di Tengah + Pilihan Mode Clean */}
      <View style={s.topControls}>
        <View style={s.centeredMonthRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => geserPeriode(-1)}
            style={({ pressed }) => [s.arrowBtn, pressed && s.pressed]}
          >
            <ChevronLeft size={18} color={tc.textPrimary} />
          </Pressable>

          <Pressable
            onPress={() => setFokusYmd(todayStr)}
            style={s.monthCenterBox}
          >
            <Text style={s.monthTitle} numberOfLines={1}>
              {judulPeriodeTengah}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => geserPeriode(1)}
            style={({ pressed }) => [s.arrowBtn, pressed && s.pressed]}
          >
            <ChevronRight size={18} color={tc.textPrimary} />
          </Pressable>
        </View>

        <View style={s.segmentWrap}>
          {(
            [
              { key: 'harian', label: tx('Harian', 'Day') },
              { key: 'mingguan', label: tx('Mingguan', 'Week') },
              { key: 'bulanan', label: tx('Bulanan', 'Month') },
            ] as const
          ).map((opt) => {
            const aktif = mode === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => {
                  setMode(opt.key);
                  if (opt.key === 'harian') {
                    setFokusYmd(todayStr);
                  }
                }}
                style={[s.segmentItem, aktif && s.segmentItemActive]}
              >
                <Text style={[s.segmentText, aktif && s.segmentTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Strip Lingkaran Tanggal Cepat pada Mode Harian */}
        {mode === 'harian' ? (
          <View style={s.dayCirclesRow}>
            {deretan7HariHarian.map((ymd) => {
              const d = parseYmd(ymd);
              const aktif = ymd === fokusYmd;
              return (
                <Pressable
                  key={ymd}
                  onPress={() => setFokusYmd(ymd)}
                  style={[s.dayCircle, aktif && s.dayCircleActive]}
                >
                  <Text
                    style={[s.dayCircleNum, aktif && s.dayCircleNumActive]}
                  >
                    {d.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* MODE HARIAN & MINGGUAN */}
      {mode !== 'bulanan' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: layout.tabContentBottomPadding,
          }}
        >
          <View style={s.boardCard}>
            <ScrollView
              horizontal={mode === 'mingguan'}
              showsHorizontalScrollIndicator={false}
              bounces={false}
            >
              <View>
                <View style={s.dayHeaderStrip}>
                  <View style={s.tzCell}>
                    <Text style={s.tzText}>WIB</Text>
                  </View>
                  {kolomHariAktif.map((ymd) => {
                    const d = parseYmd(ymd);
                    const namaHari = isEn
                      ? DAFTAR_HARI_EN[d.getDay() as IndeksHari]
                      : DAFTAR_HARI_ID[d.getDay() as IndeksHari];
                    const isActive = ymd === fokusYmd || ymd === todayStr;
                    const colWidth =
                      mode === 'harian'
                        ? lebarKolomHarian
                        : LEBAR_KOLOM_MINGGU;

                    return (
                      <Pressable
                        key={ymd}
                        onPress={() => setFokusYmd(ymd)}
                        style={[
                          s.dayHeaderCard,
                          { width: colWidth - 8 },
                          isActive && s.dayHeaderCardActive,
                        ]}
                      >
                        <Text
                          style={[
                            s.dayNameText,
                            isActive && s.dayNameTextActive,
                          ]}
                        >
                          {namaHari}
                        </Text>
                        <Text
                          style={[
                            s.dayNumText,
                            isActive && s.dayNumTextActive,
                          ]}
                        >
                          {d.getDate()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={s.gridBody}>
                  <View style={s.timeAxisCol}>
                    {daftarJam.map((jam) => (
                      <View
                        key={jam}
                        style={[s.timeAxisSlot, { height: TINGGI_PER_JAM }]}
                      >
                        <Text style={s.timeAxisLabel}>
                          {formatJamLabel(jam)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {kolomHariAktif.map((ymd) => {
                    const sesiHariIni = sesiAll.filter(
                      (x) => x.tanggal === ymd,
                    );
                    const colWidth =
                      mode === 'harian'
                        ? lebarKolomHarian
                        : LEBAR_KOLOM_MINGGU;

                    return (
                      <View
                        key={ymd}
                        style={[
                          s.dayGridCol,
                          {
                            width: colWidth,
                            height: daftarJam.length * TINGGI_PER_JAM,
                          },
                        ]}
                      >
                        {daftarJam.map((jam) => (
                          <View
                            key={jam}
                            style={[
                              s.hourCellLine,
                              { height: TINGGI_PER_JAM },
                            ]}
                          />
                        ))}

                        {sesiHariIni.map((ev) => {
                          const mulaiMnt = keMenit(ev.jamMulai);
                          const selesaiMnt = Math.max(
                            mulaiMnt + 45,
                            keMenit(ev.jamSelesai),
                          );
                          const offsetDariAwal = Math.max(
                            0,
                            mulaiMnt - JAM_MULAI_GRID * 60,
                          );
                          const durasiMnt = selesaiMnt - mulaiMnt;
                          const topPx =
                            (offsetDariAwal / 60) * TINGGI_PER_JAM + 2;
                          const heightPx = Math.max(
                            64,
                            (durasiMnt / 60) * TINGGI_PER_JAM - 4,
                          );
                          const warna = hashWarna(
                            `${ev.namaPraktikum}-${ev.kelas}`,
                            isDark,
                          );
                          const { asprakInitials, jmlPraktikan } =
                            infoPesertaSesi(ev);

                          return (
                            <Pressable
                              key={ev.id}
                              accessibilityRole="button"
                              onPress={() => bukaModalReschedule(ev)}
                              style={({ pressed }) => [
                                s.eventBlock,
                                {
                                  top: topPx,
                                  height: heightPx,
                                  backgroundColor: warna.bg,
                                  borderColor: warna.border,
                                },
                                pressed && s.pressed,
                              ]}
                            >
                              <Text
                                style={[s.eventTitle, { color: warna.fg }]}
                                numberOfLines={2}
                              >
                                {ev.namaPraktikum} {ev.kelas}
                                {ev.pertemuanKe ? ` · P${ev.pertemuanKe}` : ''}
                              </Text>

                              <View style={s.eventMetaRow}>
                                <Clock size={10} color={warna.sub} />
                                <Text
                                  style={[s.eventTime, { color: warna.sub }]}
                                  numberOfLines={1}
                                >
                                  {ev.jamMulai}–{ev.jamSelesai} · {ev.lab}
                                </Text>
                              </View>

                              {heightPx >= 82 &&
                              (asprakInitials.length > 0 ||
                                jmlPraktikan > 0) ? (
                                <View style={s.avatarStackRow}>
                                  {asprakInitials.map((ini, i) => (
                                    <View
                                      key={`${ev.id}-av-${i}`}
                                      style={[
                                        s.miniAvatar,
                                        i > 0 && { marginLeft: -6 },
                                      ]}
                                    >
                                      <Text style={s.miniAvatarText}>
                                        {ini}
                                      </Text>
                                    </View>
                                  ))}
                                  {jmlPraktikan > 0 ? (
                                    <Text
                                      style={[
                                        s.plusCountText,
                                        { color: warna.fg },
                                      ]}
                                    >
                                      +{jmlPraktikan}
                                    </Text>
                                  ) : null}
                                </View>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      ) : (
        /* MODE BULANAN */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.monthWrap,
            { paddingBottom: layout.tabContentBottomPadding },
          ]}
        >
          <View style={s.monthCard}>
            <View style={s.monthWeekdays}>
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((h) => (
                <Text key={h} style={s.monthWeekdayLabel}>
                  {h}
                </Text>
              ))}
            </View>
            <View style={s.monthGrid}>
              {selBulanan.map((cell) => {
                const aktif = cell.ymd === fokusYmd;
                return (
                  <Pressable
                    key={cell.ymd}
                    onPress={() => setFokusYmd(cell.ymd)}
                    style={[s.monthCell, aktif && s.monthCellActive]}
                  >
                    <Text
                      style={[
                        s.monthCellNum,
                        !cell.sebulan && { opacity: 0.3 },
                        aktif && s.monthCellNumActive,
                      ]}
                    >
                      {cell.tgl}
                    </Text>
                    {cell.jmlSesi > 0 ? (
                      <View style={s.monthDot} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            {sesiHariFokus.map((ev) => {
              const warna = hashWarna(
                `${ev.namaPraktikum}-${ev.kelas}`,
                isDark,
              );
              return (
                <Pressable
                  key={ev.id}
                  onPress={() => bukaModalReschedule(ev)}
                  style={[
                    s.monthEventItem,
                    { backgroundColor: warna.bg, borderColor: warna.border },
                  ]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[s.eventTitle, { color: warna.fg }]}>
                      {ev.namaPraktikum} {ev.kelas}
                      {ev.pertemuanKe ? ` · P${ev.pertemuanKe}` : ''}
                    </Text>
                    <Text style={[s.eventTime, { color: warna.sub }]}>
                      {ev.jamMulai}–{ev.jamSelesai} · {ev.lab}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Modal Ubah Jadwal Sesi Terpilih */}
      <Modal
        visible={Boolean(editingSesi)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingSesi(null)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setEditingSesi(null)}
        >
          <Pressable
            style={[s.modalSheet, { paddingBottom: insets.bottom + 24 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.modalHandle} />
            <View style={s.modalTitleRow}>
              <Text style={s.modalTitle} numberOfLines={1}>
                {editingSesi?.namaPraktikum} {editingSesi?.kelas}
                {editingSesi?.pertemuanKe
                  ? ` · P${editingSesi.pertemuanKe}`
                  : ''}
              </Text>
              <Pressable
                onPress={() => setConfirmDeleteOpen(true)}
                style={s.trashBtn}
              >
                <Trash2 size={15} color={tc.errorFg} />
              </Pressable>
            </View>

            <View style={{ gap: 6 }}>
              <View style={s.rowBetween}>
                <Text style={s.label}>{tx('Tanggal', 'Date')}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable
                    onPress={() =>
                      RE_YMD.test(tanggalInput) &&
                      setTanggalInput(tambahHari(tanggalInput, -1))
                    }
                    style={s.nudgeChip}
                  >
                    <Text style={s.nudgeText}>-1</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      RE_YMD.test(tanggalInput) &&
                      setTanggalInput(tambahHari(tanggalInput, 1))
                    }
                    style={s.nudgeChip}
                  >
                    <Text style={s.nudgeText}>+1</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      RE_YMD.test(tanggalInput) &&
                      setTanggalInput(tambahHari(tanggalInput, 7))
                    }
                    style={s.nudgeChip}
                  >
                    <Text style={s.nudgeText}>+7</Text>
                  </Pressable>
                </View>
              </View>
              <TextInput
                value={tanggalInput}
                onChangeText={setTanggalInput}
                placeholder="2026-11-28"
                style={s.input}
              />
            </View>

            <View style={s.twoCol}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={s.label}>{tx('Mulai', 'Start')}</Text>
                <TextInput
                  value={jamMulaiInput}
                  onChangeText={setJamMulaiInput}
                  style={s.input}
                />
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={s.label}>{tx('Selesai', 'End')}</Text>
                <TextInput
                  value={jamSelesaiInput}
                  onChangeText={setJamSelesaiInput}
                  style={s.input}
                />
              </View>
            </View>

            <DropdownSelect
              label={tx('Ruangan Lab', 'Lab Room')}
              value={ruangIdInput}
              options={ruanganLabs.map((r) => ({
                label: r.nama,
                value: r.id,
              }))}
              onSelect={setRuangIdInput}
            />

            <View style={s.modalActions}>
              <Pressable
                onPress={() => setEditingSesi(null)}
                style={s.cancelBtn}
              >
                <Text style={s.cancelBtnText}>{tx('Batal', 'Cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (validasiReschedule()) setConfirmSaveOpen(true);
                }}
                style={s.saveBtn}
              >
                <Text style={s.saveBtnText}>{tx('Simpan', 'Save')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialogModal
        visible={confirmSaveOpen}
        tone="confirm"
        title={tx('Simpan Jadwal Baru?', 'Save New Schedule?')}
        message={tx(
          `Pindahkan ke ${tanggalInput} (${jamMulaiInput}–${jamSelesaiInput})?`,
          `Move session to ${tanggalInput} (${jamMulaiInput}–${jamSelesaiInput})?`,
        )}
        confirmLabel={tx('Ya, Simpan', 'Yes, Save')}
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={() => void eksekusiSimpanReschedule()}
      />

      <ConfirmDialogModal
        visible={confirmDeleteOpen}
        tone="danger"
        title={tx('Hapus Sesi?', 'Delete Session?')}
        message={tx(
          `Hapus sesi ini dari jadwal tanggal ${tanggalInput}?`,
          `Remove this session from ${tanggalInput}?`,
        )}
        confirmLabel={tx('Ya, Hapus', 'Yes, Delete')}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void handleHapusSesi()}
      />
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: w.background },
    topControls: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.s3,
      paddingBottom: spacing.s3,
      gap: 10,
    },
    centeredMonthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
    },
    arrowBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: w.surface,
      borderWidth: 1,
      borderColor: w.border,
    },
    monthCenterBox: {
      minWidth: 165,
      alignItems: 'center',
    },
    monthTitle: {
      fontSize: 18,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
      textAlign: 'center',
    },
    segmentWrap: {
      flexDirection: 'row',
      backgroundColor: w.surfaceMuted,
      borderRadius: radius.pill,
      padding: 4,
      alignSelf: 'center',
    },
    segmentItem: {
      paddingHorizontal: 22,
      paddingVertical: 7,
      borderRadius: radius.pill,
    },
    segmentItemActive: {
      backgroundColor: w.surface,
    },
    segmentText: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.textMuted,
    },
    segmentTextActive: {
      color: w.textPrimary,
      fontFamily: fontFamily.bold,
    },
    dayCirclesRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginTop: 2,
    },
    dayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: w.surface,
      borderWidth: 1,
      borderColor: w.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCircleActive: {
      backgroundColor: w.primary,
      borderColor: w.primaryPressed,
    },
    dayCircleNum: {
      fontSize: 13,
      fontFamily: fontFamily.bold,
      color: w.textSecondary,
    },
    dayCircleNumActive: {
      color: w.onPrimary,
    },
    boardCard: {
      marginHorizontal: spacing.s3,
      backgroundColor: w.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: w.border,
      paddingVertical: 12,
      overflow: 'hidden',
    },
    dayHeaderStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: w.border,
    },
    tzCell: {
      width: 58,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tzText: {
      fontSize: 10,
      fontFamily: fontFamily.bold,
      color: w.textMuted,
    },
    dayHeaderCard: {
      marginHorizontal: 4,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: w.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    dayHeaderCardActive: {
      backgroundColor: w.sesiDibukaBg,
      borderWidth: 1,
      borderColor: w.radiusInsideBorder,
    },
    dayNameText: {
      fontSize: 11,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    dayNameTextActive: {
      color: w.sesiDibukaFg,
      fontFamily: fontFamily.bold,
    },
    dayNumText: {
      fontSize: 21,
      fontFamily: fontFamily.extrabold,
      color: w.textPrimary,
    },
    dayNumTextActive: {
      color: w.sesiDibukaFg,
    },
    gridBody: {
      flexDirection: 'row',
    },
    timeAxisCol: {
      width: 58,
    },
    timeAxisSlot: {
      alignItems: 'center',
      paddingTop: 6,
    },
    timeAxisLabel: {
      fontSize: 10,
      fontFamily: fontFamily.semibold,
      color: w.textMuted,
    },
    dayGridCol: {
      position: 'relative',
      borderLeftWidth: 1,
      borderLeftColor: w.border,
    },
    hourCellLine: {
      borderBottomWidth: 1,
      borderBottomColor: w.surfaceMuted,
    },
    eventBlock: {
      position: 'absolute',
      left: 5,
      right: 5,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 7,
      justifyContent: 'space-between',
      overflow: 'hidden',
    },
    eventTitle: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      lineHeight: 15,
    },
    eventMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    eventTime: {
      fontSize: 10,
      fontFamily: fontFamily.semibold,
    },
    avatarStackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    miniAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: w.graphite,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniAvatarText: {
      fontSize: 8.5,
      fontFamily: fontFamily.bold,
      color: '#FFFFFF',
    },
    plusCountText: {
      fontSize: 10,
      fontFamily: fontFamily.bold,
      marginLeft: 5,
    },
    monthWrap: {
      paddingHorizontal: layout.screenPadding,
      gap: 14,
    },
    monthCard: {
      backgroundColor: w.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: w.border,
      padding: 14,
      gap: 8,
    },
    monthWeekdays: { flexDirection: 'row' },
    monthWeekdayLabel: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      fontFamily: fontFamily.bold,
      color: w.textMuted,
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    monthCell: {
      width: '14.28%',
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    monthCellActive: {
      backgroundColor: w.primary,
    },
    monthCellNum: {
      fontSize: 13,
      fontFamily: fontFamily.semibold,
      color: w.textPrimary,
    },
    monthCellNumActive: {
      color: w.onPrimary,
      fontFamily: fontFamily.bold,
    },
    monthDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: w.sesiDibukaFg,
    },
    monthEventItem: {
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: w.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 22,
      paddingTop: 12,
      gap: 12,
      borderTopWidth: 1,
      borderColor: w.border,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: w.border,
    },
    modalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    modalTitle: {
      fontSize: 16,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
      flex: 1,
    },
    trashBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      backgroundColor: w.errorBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    nudgeChip: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: w.surfaceMuted,
      borderWidth: 1,
      borderColor: w.border,
    },
    nudgeText: {
      fontSize: 11,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    label: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    input: {
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      paddingHorizontal: 14,
      fontSize: 14,
      fontFamily: fontFamily.medium,
      color: w.textPrimary,
    },
    twoCol: { flexDirection: 'row', gap: 10 },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    saveBtn: {
      flex: 1.3,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: w.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: w.onPrimary,
    },
    pressed: { opacity: 0.8 },
  });
