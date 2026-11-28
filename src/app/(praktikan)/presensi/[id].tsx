import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  KeyRound,
  MapPin,
  QrCode,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react-native';

import {
  EmptyState,
  LokasiStatusCard,
  PermissionBanner,
  SheetModal,
  StatusBadge,
  Tombol,
  useToast,
  type StatusPemeriksaanLokasi,
} from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { AlasanTolak, StatusIzin } from '@/data/dummy';
import { useLocation } from '@/hooks/useLocation';
import {
  colors,
  fontFamily,
  layout,
  radius,
  spacing,
  type,
} from '@/theme/tokens';
import {
  formatHariTanggalSingkat,
  formatJam,
  titikJam,
} from '@/utils/format';
import { hitungJarak, koordinatValid } from '@/utils/geo';
import { cekValiditasQr, sudahLewat, sudahMulai } from '@/utils/statusSesi';

const TICK_WAKTU_MS = 5_000;

function terjemahkanAlasanTolak(
  alasan: AlasanTolak,
  isEn: boolean,
  opsi: {
    waktuHadirPertama?: string | null;
    jarakSaatIni?: number | null;
    radiusLab?: number | null;
    jamMulai?: string;
    jamSelesai?: string;
    izinStatus?: StatusIzin;
  },
): { judul: string; pesan: string } {
  switch (alasan) {
    case 'SUDAH_PRESENSI':
      return {
        judul: isEn ? 'Attendance already recorded' : 'Presensi sudah tercatat',
        pesan: opsi.waktuHadirPertama
          ? isEn
            ? `You already checked in for this session at ${opsi.waktuHadirPertama}.`
            : `Kamu sudah melakukan presensi pada sesi ini pukul ${opsi.waktuHadirPertama}.`
          : isEn
            ? 'You are already marked present for this practicum session.'
            : 'Kamu sudah tercatat hadir pada sesi praktikum ini.',
      };
    case 'SUDAH_IZIN':
      if (opsi.izinStatus === 'DITERIMA') {
        return {
          judul: isEn ? 'Leave approved' : 'Izin diterima',
          pesan: isEn
            ? 'You are recorded as excused absent and are not fined.'
            : 'Kamu tercatat tidak hadir dengan izin dan bebas denda.',
        };
      }
      return {
        judul: isEn ? 'Leave request pending' : 'Izin sedang diproses',
        pesan: isEn
          ? "Your leave request is still awaiting the assistant's decision."
          : 'Pengajuan izinmu masih menunggu keputusan Asprak.',
      };
    case 'LUAR_RADIUS':
      return {
        judul: isEn
          ? 'Outside laboratory radius'
          : 'Di luar radius laboratorium',
        pesan:
          typeof opsi.jarakSaatIni === 'number' &&
          typeof opsi.radiusLab === 'number'
            ? isEn
              ? `Your position is ${opsi.jarakSaatIni} m from the laboratory (max limit ${opsi.radiusLab} m). Move closer to the lab and try again.`
              : `Posisimu berjarak ${opsi.jarakSaatIni} m dari laboratorium (batas maksimal ${opsi.radiusLab} m). Mendekatlah ke ruang lab lalu coba lagi.`
            : isEn
              ? 'Your position is outside the laboratory radius limit. Move closer to the lab and try again.'
              : 'Posisimu berada di luar batas radius laboratorium. Mendekatlah ke ruang praktikum lalu coba lagi.',
      };
    case 'BELUM_WAKTUNYA':
      return {
        judul: isEn ? 'Session has not started' : 'Sesi belum dimulai',
        pesan: opsi.jamMulai
          ? isEn
            ? `This session starts at ${titikJam(opsi.jamMulai)} WIB.`
            : `Jadwal sesi ini baru dimulai pukul ${titikJam(opsi.jamMulai)} WIB.`
          : isEn
            ? 'Attendance time for this session has not started yet.'
            : 'Waktu presensi untuk sesi ini belum dimulai.',
      };
    case 'WAKTU_HABIS':
      return {
        judul: isEn
          ? 'Attendance time has ended'
          : 'Waktu presensi telah berakhir',
        pesan: opsi.jamSelesai
          ? isEn
            ? `The attendance deadline ended at ${titikJam(opsi.jamSelesai)} WIB.`
            : `Batas waktu presensi sesi ini telah berakhir pada pukul ${titikJam(opsi.jamSelesai)} WIB.`
          : isEn
            ? 'This practicum session has ended.'
            : 'Waktu pelaksanaan sesi praktikum ini telah berakhir.',
      };
    case 'SESI_SUDAH_DITUTUP':
      return {
        judul: isEn ? 'Session already closed' : 'Sesi sudah ditutup',
        pesan: isEn
          ? 'This practicum session has been closed by the assistant and no longer accepts attendance.'
          : 'Sesi praktikum ini telah ditutup oleh asisten dan tidak lagi menerima presensi.',
      };
    case 'SESI_TIDAK_DIBUKA':
      return {
        judul: isEn ? 'Session not opened yet' : 'Sesi belum dibuka asisten',
        pesan: isEn
          ? 'Attendance is only available once the assistant opens this practicum session.'
          : 'Presensi hanya dapat dilakukan saat asisten telah membuka sesi praktikum ini.',
      };
    case 'KOORDINAT_TIDAK_ADA':
      return {
        judul: isEn ? 'Location not detected' : 'Lokasi belum terbaca',
        pesan: isEn
          ? 'Your device GPS coordinates are unavailable. Ensure GPS is enabled and location permission is granted.'
          : 'Titik koordinat GPS perangkatmu belum tersedia. Pastikan GPS aktif dan izin lokasi diberikan.',
      };
    case 'LAB_BELUM_DIATUR':
      return {
        judul: isEn ? 'Lab location not set' : 'Lokasi lab belum diatur',
        pesan: isEn
          ? 'This session does not have valid laboratory coordinates yet. Contact your assistant.'
          : 'Sesi ini belum memiliki titik koordinat laboratorium yang valid. Hubungi asisten praktikum.',
      };
    case 'TIDAK_BERHAK':
      return {
        judul: isEn ? 'Cannot check in' : 'Tidak dapat melakukan presensi',
        pesan: isEn
          ? 'Your account or class is not registered for this practicum session.'
          : 'Akun atau kelas praktikum kamu tidak terdaftar untuk melakukan presensi pada sesi ini.',
      };
    case 'JARINGAN':
    default:
      return {
        judul: isEn ? 'Network connection issue' : 'Koneksi jaringan bermasalah',
        pesan: isEn
          ? 'Failed to reach the server while recording attendance. Check your internet connection and try again.'
          : 'Gagal menghubungi server saat mencatat presensi. Periksa koneksi internetmu lalu coba lagi.',
      };
  }
}

export default function HalamanPresensiPraktikan() {
  const { id, qrToken } = useLocalSearchParams<{
    id: string;
    qrToken?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';

  const {
    currentUser,
    labs,
    getSesiById,
    getStatusEfektif,
    sudahPresensi,
    getIzinBySesiPraktikan,
    markAttendance,
    loading,
    error: errorSync,
    retrySync,
  } = useSession();

  const {
    status: statusLokasiHook,
    koordinat,
    pesanError: pesanErrorLokasi,
    mintaIzin,
    coba: muatUlangLokasi,
  } = useLocation();

  const [kodeInput, setKodeInput] = useState<string>(() =>
    (qrToken ?? '').trim().toUpperCase(),
  );
  const [memproses, setMemproses] = useState(false);
  const [galatModal, setGalatModal] = useState<{
    judul: string;
    pesan: string;
  } | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Sinkronkan bila datang dari Scan QR dengan parameter qrToken
  useEffect(() => {
    if (qrToken) {
      setKodeInput(qrToken.trim().toUpperCase());
    }
  }, [qrToken]);

  // Periksa ulang waktu secara berkala agar masa berlaku QR 15 menit & PB-06 selalu akurat
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_WAKTU_MS);
    return () => clearInterval(timer);
  }, []);

  const s = getSesiById(id);

  const labSesi = useMemo(() => {
    if (!s) return null;
    if (s.labId) {
      const byId = labs.find((l) => l.id === s.labId);
      if (byId) return byId;
    }
    return (
      labs.find(
        (l) => l.nama.trim().toLowerCase() === s.lab.trim().toLowerCase(),
      ) ?? null
    );
  }, [labs, s]);

  const punyaKoordinatValid = Boolean(koordinat && koordinatValid(koordinat));
  const punyaLabValid = Boolean(
    labSesi &&
      koordinatValid({ lat: labSesi.lat, lng: labSesi.lng }) &&
      Number.isFinite(labSesi.radius) &&
      labSesi.radius > 0,
  );

  const jarakMeter = useMemo(() => {
    if (!punyaKoordinatValid || !punyaLabValid || !koordinat || !labSesi) {
      return null;
    }
    return Math.round(hitungJarak(koordinat, labSesi));
  }, [punyaKoordinatValid, punyaLabValid, koordinat, labSesi]);

  const statusKartuLokasi: StatusPemeriksaanLokasi = (() => {
    if (!s || !s.labId || !punyaLabValid) return 'lab-belum-diatur';
    if (statusLokasiHook === 'izin-ditolak') return 'izin-ditolak';
    if (statusLokasiHook === 'gps-mati') return 'gps-mati';
    if (statusLokasiHook === 'koordinat-belum-ada') return 'koordinat-belum-ada';
    if (statusLokasiHook === 'error') return 'error';
    if (statusLokasiHook === 'memuat' || jarakMeter === null) return 'memuat';
    if (labSesi && jarakMeter <= labSesi.radius) return 'dalam-radius';
    return 'luar-radius';
  })();

  const statusEfektif = s ? getStatusEfektif(s) : 'TERJADWAL';
  const belumMulai = s ? !sudahMulai(s, now) : true;
  const waktuHabis = s ? sudahLewat(s, now) : false;
  const hadir = s && currentUser ? sudahPresensi(s.id, currentUser.id) : undefined;
  const izinSaya =
    s && currentUser ? getIzinBySesiPraktikan(s.id, currentUser.id) : undefined;

  const izinDiterima = izinSaya?.status === 'DITERIMA';
  const sesiBisaPresensi =
    Boolean(s) &&
    statusEfektif === 'DIBUKA' &&
    !belumMulai &&
    !waktuHabis &&
    !hadir &&
    !izinDiterima;

  const hasilCekKode = useMemo(() => {
    if (!s) return { ok: false as const, alasan: 'QR_INVALID' as const };
    return cekValiditasQr(s, kodeInput, now);
  }, [s, kodeInput, now]);

  const kodeTerverifikasi = hasilCekKode.ok;
  const qrSesiKedaluwarsa =
    Boolean(s) &&
    sesiBisaPresensi &&
    (!s?.qrToken ||
      !s?.qrExpiresAt ||
      now > s.qrExpiresAt ||
      (!hasilCekKode.ok && hasilCekKode.alasan === 'QR_EXPIRED'));

  const lokasiSiapSubmit =
    statusKartuLokasi === 'dalam-radius' && punyaKoordinatValid;

  if (
    !currentUser ||
    !s ||
    (currentUser.kelas &&
      s.kelas.trim().toUpperCase() !== currentUser.kelas.trim().toUpperCase())
  ) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: themeColors.background, paddingTop: insets.top },
        ]}
      >
        <View
          style={[styles.topHeader, { borderBottomColor: themeColors.border }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Back' : 'Kembali'}
            onPress={() => router.back()}
            style={[
              styles.iconBtn,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
              },
            ]}
          >
            <ArrowLeft size={20} color={themeColors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
              {isEn ? 'ATTENDANCE VERIFICATION' : 'VERIFIKASI KEHADIRAN'}
            </Text>
            <Text
              style={[styles.headerTitle, { color: themeColors.textPrimary }]}
            >
              {isEn ? 'Practicum Attendance' : 'Presensi Praktikum'}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyWrap}>
          <EmptyState
            judul={
              loading
                ? isEn
                  ? 'Loading session…'
                  : 'Memuat data sesi…'
                : isEn
                  ? 'Session not found'
                  : 'Sesi tidak ditemukan'
            }
            pesan={
              loading
                ? isEn
                  ? 'Please wait a moment.'
                  : 'Mohon tunggu sebentar.'
                : isEn
                  ? 'This practicum session is not available for your class.'
                  : 'Sesi praktikum ini tidak tersedia untuk kelasmu.'
            }
          />
        </View>
      </View>
    );
  }

  const waktuHadirTeks = hadir ? titikJam(formatJam(hadir.waktuHadir)) : null;

  const tombolKonfirmasiNonaktif =
    !sesiBisaPresensi || !kodeTerverifikasi || !lokasiSiapSubmit || memproses;

  const labelTombolUtama = (() => {
    if (memproses) {
      return isEn ? 'Verifying & Recording…' : 'Memverifikasi & Mencatat…';
    }
    if (hadir) {
      return isEn
        ? `Checked In · ${waktuHadirTeks}`
        : `Sudah Presensi · ${waktuHadirTeks}`;
    }
    if (izinDiterima) {
      return isEn
        ? 'Excused absence · no fine'
        : 'Izin diterima · bebas denda';
    }
    if (waktuHabis) {
      return isEn
        ? 'Attendance time has ended'
        : 'Waktu presensi telah berakhir';
    }
    if (s.status === 'SELESAI' || statusEfektif === 'SELESAI') {
      return isEn ? 'Session closed' : 'Sesi telah ditutup';
    }
    if (belumMulai) {
      return isEn ? 'Session has not started' : 'Sesi belum dimulai';
    }
    if (statusEfektif !== 'DIBUKA') {
      return isEn ? 'Session not opened yet' : 'Sesi belum dibuka asisten';
    }
    if (qrSesiKedaluwarsa) {
      return isEn
        ? 'QR / Code expired — ask assistant'
        : 'QR / Kode kedaluwarsa — minta asisten';
    }
    if (!kodeTerverifikasi) {
      return isEn
        ? 'Enter attendance code first'
        : 'Masukkan kode presensi dulu';
    }
    if (statusKartuLokasi === 'luar-radius') {
      return isEn
        ? 'Outside laboratory radius'
        : 'Di luar radius laboratorium';
    }
    if (statusKartuLokasi === 'izin-ditolak') {
      return isEn ? 'Location permission required' : 'Izin lokasi diperlukan';
    }
    if (statusKartuLokasi === 'gps-mati') {
      return isEn ? 'Enable GPS to check in' : 'Aktifkan GPS untuk presensi';
    }
    if (
      statusKartuLokasi === 'memuat' ||
      statusKartuLokasi === 'koordinat-belum-ada'
    ) {
      return isEn ? 'Waiting for GPS coordinates…' : 'Menunggu koordinat GPS…';
    }
    if (statusKartuLokasi === 'lab-belum-diatur') {
      return isEn ? 'Lab location not set' : 'Lokasi lab belum diatur';
    }
    return isEn ? 'Check In Now' : 'Presensi Sekarang';
  })();

  const handlePresensi = async () => {
    if (memproses || hadir) return;

    const cekTerakhir = cekValiditasQr(s, kodeInput, Date.now());
    if (!cekTerakhir.ok) {
      setGalatModal({
        judul: isEn ? 'Invalid or Expired Code' : 'Kode Tidak Valid / Kedaluwarsa',
        pesan:
          cekTerakhir.alasan === 'WAKTU_HABIS'
            ? isEn
              ? 'Attendance time for this session has ended.'
              : 'Waktu presensi untuk sesi ini telah berakhir.'
            : isEn
              ? 'This attendance code has expired or does not match. Ask your assistant to renew the QR & code.'
              : 'Kode presensi sudah kedaluwarsa atau tidak cocok. Minta asisten memperbarui QR & kode presensi.',
      });
      return;
    }

    setMemproses(true);
    try {
      const hasil = await markAttendance(s.id, koordinat);
      setMemproses(false);

      if (hasil.ok) {
        const jarakTeks =
          typeof hasil.jarak === 'number'
            ? isEn
              ? ` (${hasil.jarak} m from lab)`
              : ` (${hasil.jarak} m dari lab)`
            : '';
        showToast(
          isEn
            ? `Attendance recorded successfully${jarakTeks}.`
            : `Presensi berhasil dicatat${jarakTeks}.`,
        );
        return;
      }

      const infoGalat = terjemahkanAlasanTolak(hasil.alasan, isEn, {
        waktuHadirPertama: waktuHadirTeks,
        jarakSaatIni: jarakMeter,
        radiusLab: labSesi?.radius ?? null,
        jamMulai: s.jamMulai,
        jamSelesai: s.jamSelesai,
        izinStatus: izinSaya?.status,
      });
      setGalatModal(infoGalat);
    } catch {
      setMemproses(false);
      setGalatModal(
        terjemahkanAlasanTolak('JARINGAN', isEn, {
          waktuHadirPertama: waktuHadirTeks,
        }),
      );
    }
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: themeColors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header Halaman Presensi */}
      <View
        style={[styles.topHeader, { borderBottomColor: themeColors.border }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isEn ? 'Back' : 'Kembali'}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              borderColor: themeColors.border,
              backgroundColor: pressed
                ? themeColors.surfaceMuted
                : themeColors.surface,
            },
          ]}
        >
          <ArrowLeft size={20} color={themeColors.textPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {isEn ? 'ATTENDANCE VERIFICATION' : 'VERIFIKASI KEHADIRAN'}
          </Text>
          <Text
            style={[styles.headerTitle, { color: themeColors.textPrimary }]}
            numberOfLines={1}
          >
            {isEn ? 'Practicum Attendance' : 'Presensi Praktikum'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isEn ? 'Open laboratory map' : 'Buka peta laboratorium'
          }
          onPress={() => router.push('/peta' as any)}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              borderColor: themeColors.border,
              backgroundColor: pressed
                ? themeColors.surfaceMuted
                : themeColors.surface,
            },
          ]}
        >
          <MapPin size={19} color={themeColors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + spacing.s6, spacing.s8) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner Gangguan Jaringan atau Izin Perangkat */}
        {errorSync ? (
          <PermissionBanner
            jenis="jaringan"
            pesan={errorSync}
            onAksi={retrySync}
          />
        ) : statusLokasiHook === 'izin-ditolak' ? (
          <PermissionBanner
            jenis="izin-lokasi-ditolak"
            pesan={pesanErrorLokasi ?? undefined}
            onAksi={mintaIzin}
          />
        ) : statusLokasiHook === 'gps-mati' ? (
          <PermissionBanner
            jenis="gps-mati"
            pesan={pesanErrorLokasi ?? undefined}
            onAksi={muatUlangLokasi}
          />
        ) : statusLokasiHook === 'koordinat-belum-ada' ? (
          <PermissionBanner
            jenis="koordinat-belum-ada"
            pesan={pesanErrorLokasi ?? undefined}
            onAksi={muatUlangLokasi}
          />
        ) : statusLokasiHook === 'error' ? (
          <PermissionBanner
            jenis="error"
            pesan={pesanErrorLokasi ?? undefined}
            onAksi={muatUlangLokasi}
          />
        ) : null}

        {/* 1. Kartu Informasi Sesi & Status Efektif */}
        <View
          style={[
            styles.sessionCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.sessionTopRow}>
            <View style={styles.sessionTitleWrap}>
              <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
                {isEn ? 'PRACTICUM SESSION' : 'SESI PRAKTIKUM'}
              </Text>
              <Text
                style={[styles.sessionName, { color: themeColors.textPrimary }]}
              >
                {s.namaPraktikum}
              </Text>
              {s.topik ? (
                <Text
                  style={[
                    styles.sessionTopic,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {s.topik}
                </Text>
              ) : null}
            </View>
            <StatusBadge status={statusEfektif} />
          </View>

          <View
            style={[styles.metaGrid, { borderTopColor: themeColors.border }]}
          >
            <View style={styles.metaCell}>
              <Users size={15} color={themeColors.textMuted} />
              <Text
                style={[styles.metaText, { color: themeColors.textSecondary }]}
              >
                {isEn ? `Class ${s.kelas}` : `Kelas ${s.kelas}`}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <MapPin size={15} color={themeColors.textMuted} />
              <Text
                style={[styles.metaText, { color: themeColors.textSecondary }]}
                numberOfLines={1}
              >
                {labSesi?.nama ?? s.lab}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <CalendarDays size={15} color={themeColors.textMuted} />
              <Text
                style={[styles.metaText, { color: themeColors.textSecondary }]}
              >
                {formatHariTanggalSingkat(s.tanggal)}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Clock3 size={15} color={themeColors.textMuted} />
              <Text
                style={[styles.metaText, { color: themeColors.textSecondary }]}
              >
                {titikJam(s.jamMulai)}–{titikJam(s.jamSelesai)} WIB
              </Text>
            </View>
          </View>

          {/* Keterangan Waktu Sesi (PB-06) */}
          {waktuHabis ? (
            <View
              style={[
                styles.timeNoticeDanger,
                {
                  backgroundColor: themeColors.radiusOutsideBg,
                  borderColor: themeColors.radiusOutsideBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.timeNoticeDangerText,
                  { color: themeColors.radiusOutsideFg },
                ]}
              >
                {isEn
                  ? `Attendance time has ended (scheduled until ${titikJam(s.jamSelesai)} WIB).`
                  : `Waktu presensi telah berakhir (jadwal selesai pukul ${titikJam(s.jamSelesai)} WIB).`}
              </Text>
            </View>
          ) : belumMulai ? (
            <View
              style={[
                styles.timeNoticeWarn,
                {
                  backgroundColor: themeColors.gpsOffBg,
                  borderColor: themeColors.gpsOffBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.timeNoticeWarnText,
                  { color: themeColors.gpsOffFg },
                ]}
              >
                {isEn
                  ? `Session has not started yet. Attendance opens at ${titikJam(s.jamMulai)} WIB.`
                  : `Sesi belum dimulai. Presensi baru dapat dilakukan mulai pukul ${titikJam(s.jamMulai)} WIB.`}
              </Text>
            </View>
          ) : statusEfektif !== 'DIBUKA' ? (
            <View
              style={[
                styles.timeNoticeWarn,
                {
                  backgroundColor: themeColors.gpsOffBg,
                  borderColor: themeColors.gpsOffBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.timeNoticeWarnText,
                  { color: themeColors.gpsOffFg },
                ]}
              >
                {s.status === 'SELESAI'
                  ? isEn
                    ? 'This session has been closed by the assistant.'
                    : 'Sesi ini telah ditutup oleh asisten.'
                  : isEn
                    ? 'Waiting for the assistant to open this practicum session.'
                    : 'Menunggu asisten membuka sesi praktikum.'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 2. Kartu Hasil Pemeriksaan Lokasi & Radius Lab */}
        <LokasiStatusCard
          status={statusKartuLokasi}
          namaLab={labSesi?.nama ?? s.lab}
          alamatLab={labSesi?.alamat}
          radiusMeter={labSesi?.radius}
          jarakMeter={jarakMeter}
          akurasiMeter={koordinat?.akurasi ?? null}
          pesanTambahan={pesanErrorLokasi}
          onRefresh={muatUlangLokasi}
          onMintaIzin={mintaIzin}
        />

        {/* 3. Bukti Kehadiran Tercatat (Bila Sudah Presensi) */}
        {hadir ? (
          <View
            style={[
              styles.attendedCard,
              {
                borderColor: themeColors.radiusInsideBorder,
                backgroundColor: themeColors.radiusInsideBg,
              },
            ]}
          >
            <View style={styles.attendedHeader}>
              <CheckCircle2 size={22} color={themeColors.radiusInsideFg} />
              <View style={styles.attendedHeaderCopy}>
                <Text
                  style={[
                    styles.attendedTitle,
                    { color: themeColors.radiusInsideFg },
                  ]}
                >
                  {isEn
                    ? 'Attendance Recorded Successfully'
                    : 'Presensi Berhasil Tercatat'}
                </Text>
                <Text
                  style={[
                    styles.attendedSub,
                    { color: themeColors.radiusInsideFg },
                  ]}
                >
                  {isEn
                    ? `Recorded at ${waktuHadirTeks} WIB`
                    : `Tercatat pada pukul ${waktuHadirTeks} WIB`}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.attendedMetaRow,
                { borderTopColor: themeColors.radiusInsideBorder },
              ]}
            >
              <View style={styles.attendedMetaItem}>
                <Compass size={14} color={themeColors.radiusInsideFg} />
                <Text
                  style={[
                    styles.attendedMetaText,
                    { color: themeColors.radiusInsideFg },
                  ]}
                >
                  {isEn ? 'Recorded distance: ' : 'Jarak tercatat: '}
                  {typeof hadir.jarak === 'number'
                    ? isEn
                      ? `${Math.round(hadir.jarak)} m from lab`
                      : `${Math.round(hadir.jarak)} m dari lab`
                    : isEn
                      ? 'Verified'
                      : 'Terverifikasi'}
                </Text>
              </View>
              <View style={styles.attendedMetaItem}>
                <ShieldCheck size={14} color={themeColors.radiusInsideFg} />
                <Text
                  style={[
                    styles.attendedMetaText,
                    { color: themeColors.radiusInsideFg },
                  ]}
                >
                  {currentUser.nama} ({currentUser.nim ?? '-'})
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* 4. Input Kode Presensi & Tombol Presensi */
          <View
            style={[
              styles.confirmCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.confirmHeaderRow}>
              <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
                {isEn ? 'ATTENDANCE' : 'PRESENSI'}
              </Text>
              {sesiBisaPresensi && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/scan-qr' as any)}
                  style={({ pressed }) => [
                    styles.scanQrChip,
                    {
                      backgroundColor: pressed
                        ? themeColors.surfaceMuted
                        : themeColors.background,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <QrCode size={14} color={themeColors.primary} />
                  <Text
                    style={[
                      styles.scanQrChipText,
                      { color: themeColors.textPrimary },
                    ]}
                  >
                    {isEn ? 'Scan QR' : 'Scan QR'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Input Kode Presensi */}
            <View style={styles.codeFieldWrap}>
              <Text
                style={[
                  styles.codeFieldLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                {isEn
                  ? 'Attendance Code (from Assistant QR)'
                  : 'Kode Presensi (dari QR Asisten)'}
              </Text>
              <View
                style={[
                  styles.codeInputRow,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: kodeTerverifikasi
                      ? themeColors.radiusInsideBorder
                      : kodeInput.trim().length > 0
                        ? themeColors.dangerBorder
                        : themeColors.border,
                    opacity: sesiBisaPresensi ? 1 : 0.55,
                  },
                ]}
              >
                <KeyRound
                  size={17}
                  color={
                    kodeTerverifikasi
                      ? themeColors.radiusInsideFg
                      : themeColors.textMuted
                  }
                />
                <TextInput
                  value={kodeInput}
                  onChangeText={(txt) =>
                    setKodeInput(txt.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
                  }
                  editable={sesiBisaPresensi && !memproses}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={12}
                  placeholder={
                    isEn ? 'Enter 6-character code' : 'Masukkan kode 6 karakter'
                  }
                  placeholderTextColor={themeColors.textMuted}
                  style={[
                    styles.codeTextInput,
                    { color: themeColors.textPrimary },
                  ]}
                />
                {kodeTerverifikasi ? (
                  <CheckCircle2 size={18} color={themeColors.radiusInsideFg} />
                ) : kodeInput.trim().length > 0 ? (
                  <XCircle size={18} color={themeColors.errorFg} />
                ) : null}
              </View>

              {sesiBisaPresensi && (
                <Text
                  style={[
                    styles.codeHint,
                    {
                      color: kodeTerverifikasi
                        ? themeColors.radiusInsideFg
                        : qrSesiKedaluwarsa || kodeInput.trim().length > 0
                          ? themeColors.errorFg
                          : themeColors.textMuted,
                    },
                  ]}
                >
                  {kodeTerverifikasi
                    ? isEn
                      ? 'Attendance code verified.'
                      : 'Kode presensi terverifikasi.'
                    : qrSesiKedaluwarsa
                      ? isEn
                        ? 'Session QR / code has expired. Ask your assistant to renew it.'
                        : 'QR / kode sesi telah kedaluwarsa. Minta asisten memperbaruinya.'
                      : kodeInput.trim().length > 0
                        ? isEn
                          ? 'Code does not match or has expired.'
                          : 'Kode tidak cocok atau sudah kedaluwarsa.'
                        : isEn
                          ? 'Scan the QR code or enter the 6-character code shown by your assistant.'
                          : 'Pindai QR atau masukkan kode 6 karakter yang ditampilkan asisten.'}
                </Text>
              )}
            </View>

            <Tombol
              variant="primer"
              loading={memproses}
              disabled={tombolKonfirmasiNonaktif}
              icon={
                !sesiBisaPresensi || !kodeTerverifikasi || !lokasiSiapSubmit ? (
                  <CheckCircle2 size={18} color={themeColors.disabledText} />
                ) : undefined
              }
              onPress={handlePresensi}
            >
              {labelTombolUtama}
            </Tombol>
          </View>
        )}
      </ScrollView>

      {/* Modal Penolakan / Error Presensi */}
      <SheetModal
        visible={galatModal !== null}
        kicker={isEn ? 'ATTENDANCE VERIFICATION' : 'VERIFIKASI PRESENSI'}
        judul={galatModal?.judul ?? ''}
        onClose={() => setGalatModal(null)}
        footer={
          <Tombol variant="sekunder" onPress={() => setGalatModal(null)}>
            {isEn ? 'Close' : 'Tutup'}
          </Tombol>
        }
      >
        <View style={styles.errorRow}>
          <View
            style={[styles.errorIcon, { backgroundColor: themeColors.errorBg }]}
          >
            <Text
              style={[styles.errorIconText, { color: themeColors.errorFg }]}
            >
              !
            </Text>
          </View>
          <Text
            style={[styles.errorPesan, { color: themeColors.textPrimary }]}
          >
            {galatModal?.pesan}
          </Text>
        </View>
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    minHeight: 68,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.s2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    ...type.h2,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 42,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    padding: layout.screenPadding,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s4,
    gap: spacing.s4,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  sessionCard: {
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.s3,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.s3,
  },
  sessionTitleWrap: {
    flex: 1,
    gap: 2,
  },
  sessionName: {
    ...type.h2,
    color: colors.textPrimary,
  },
  sessionTopic: {
    ...type.caption,
    color: colors.textSecondary,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s2,
    paddingTop: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaCell: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  metaText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  timeNoticeWarn: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2 + 2,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  timeNoticeWarnText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
  },
  timeNoticeDanger: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2 + 2,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  timeNoticeDangerText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
  },
  attendedCard: {
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    gap: spacing.s3,
  },
  attendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
  },
  attendedHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  attendedTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
  },
  attendedSub: {
    ...type.caption,
  },
  attendedMetaRow: {
    gap: 6,
    paddingTop: spacing.s2,
    borderTopWidth: 1,
  },
  attendedMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendedMetaText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
  },
  confirmCard: {
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    gap: spacing.s3 + 2,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  scanQrChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  scanQrChipText: {
    ...type.micro,
    fontFamily: fontFamily.bold,
  },
  codeFieldWrap: {
    gap: 6,
  },
  codeFieldLabel: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
  },
  codeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2 + 2,
    paddingHorizontal: spacing.s3,
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  codeTextInput: {
    flex: 1,
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    letterSpacing: 2,
    paddingVertical: 10,
  },
  codeHint: {
    ...type.micro,
    lineHeight: 16,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s3,
  },
  errorIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    ...type.bodyStrong,
  },
  errorPesan: {
    ...type.body,
    flex: 1,
  },
});
