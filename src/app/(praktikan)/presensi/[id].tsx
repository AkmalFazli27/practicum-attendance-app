import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Compass,
  MapPin,
  ShieldCheck,
  Users,
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
import type { AlasanTolak } from '@/data/dummy';
import { useLocation } from '@/hooks/useLocation';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import {
  formatHariTanggalSingkat,
  formatJam,
  titikJam,
} from '@/utils/format';
import { hitungJarak, koordinatValid } from '@/utils/geo';
import { sudahLewat, sudahMulai } from '@/utils/statusSesi';

const TICK_WAKTU_MS = 15_000;

function terjemahkanAlasanTolak(
  alasan: AlasanTolak,
  opsi: {
    waktuHadirPertama?: string | null;
    jarakSaatIni?: number | null;
    radiusLab?: number | null;
    jamMulai?: string;
    jamSelesai?: string;
  },
): { judul: string; pesan: string } {
  switch (alasan) {
    case 'SUDAH_PRESENSI':
      return {
        judul: 'Presensi sudah tercatat',
        pesan: opsi.waktuHadirPertama
          ? `Kamu sudah melakukan presensi pada sesi ini pukul ${opsi.waktuHadirPertama}.`
          : 'Kamu sudah tercatat hadir pada sesi praktikum ini.',
      };
    case 'SUDAH_IZIN':
      return {
        judul: 'Sudah mengajukan izin',
        pesan:
          'Kamu sudah mengajukan izin pada sesi ini sehingga tidak dapat melakukan presensi.',
      };
    case 'LUAR_RADIUS':
      return {
        judul: 'Di luar radius laboratorium',
        pesan:
          typeof opsi.jarakSaatIni === 'number' &&
          typeof opsi.radiusLab === 'number'
            ? `Posisimu berjarak ${opsi.jarakSaatIni} m dari laboratorium (batas maksimal ${opsi.radiusLab} m). Mendekatlah ke ruang lab lalu coba lagi.`
            : 'Posisimu berada di luar batas radius laboratorium. Mendekatlah ke ruang praktikum lalu coba lagi.',
      };
    case 'BELUM_WAKTUNYA':
      return {
        judul: 'Sesi belum dimulai',
        pesan: opsi.jamMulai
          ? `Jadwal sesi ini baru dimulai pukul ${titikJam(opsi.jamMulai)} WIB.`
          : 'Waktu presensi untuk sesi ini belum dimulai.',
      };
    case 'WAKTU_HABIS':
      return {
        judul: 'Waktu presensi telah berakhir',
        pesan: opsi.jamSelesai
          ? `Batas waktu presensi sesi ini telah berakhir pada pukul ${titikJam(opsi.jamSelesai)} WIB.`
          : 'Waktu pelaksanaan sesi praktikum ini telah berakhir.',
      };
    case 'SESI_SUDAH_DITUTUP':
      return {
        judul: 'Sesi sudah ditutup',
        pesan:
          'Sesi praktikum ini telah ditutup oleh asisten dan tidak lagi menerima presensi.',
      };
    case 'SESI_TIDAK_DIBUKA':
      return {
        judul: 'Sesi belum dibuka asisten',
        pesan:
          'Presensi hanya dapat dilakukan saat asisten telah membuka sesi praktikum ini.',
      };
    case 'KOORDINAT_TIDAK_ADA':
      return {
        judul: 'Lokasi belum terbaca',
        pesan:
          'Titik koordinat GPS perangkatmu belum tersedia. Pastikan GPS aktif dan izin lokasi diberikan.',
      };
    case 'LAB_BELUM_DIATUR':
      return {
        judul: 'Lokasi lab belum diatur',
        pesan:
          'Sesi ini belum memiliki titik koordinat laboratorium yang valid. Hubungi asisten praktikum.',
      };
    case 'TIDAK_BERHAK':
      return {
        judul: 'Tidak dapat melakukan presensi',
        pesan:
          'Akun atau kelas praktikum kamu tidak terdaftar untuk melakukan presensi pada sesi ini.',
      };
    case 'JARINGAN':
    default:
      return {
        judul: 'Koneksi jaringan bermasalah',
        pesan:
          'Gagal menghubungi server saat mencatat presensi. Periksa koneksi internetmu lalu coba lagi.',
      };
  }
}

export default function HalamanPresensiPraktikan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { themeColors } = usePreferences();

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

  const [setujuHadir, setSetujuHadir] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [galatModal, setGalatModal] = useState<{
    judul: string;
    pesan: string;
  } | null>(null);
  const [, setTick] = useState(0);

  // Periksa ulang waktu secara berkala setiap 15 detik agar PB-06 otomatis memperbarui status
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), TICK_WAKTU_MS);
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

  // Gunakan utilitas resmi PM (hitungJarak dari @/utils/geo) untuk menampilkan pratinjau jarak
  const jarakMeter = useMemo(() => {
    if (!punyaKoordinatValid || !punyaLabValid || !koordinat || !labSesi) {
      return null;
    }
    return Math.round(hitungJarak(koordinat, labSesi));
  }, [punyaKoordinatValid, punyaLabValid, koordinat, labSesi]);

  if (
    !currentUser ||
    !s ||
    (currentUser.kelas &&
      s.kelas.trim().toUpperCase() !== currentUser.kelas.trim().toUpperCase())
  ) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.kicker}>VERIFIKASI KEHADIRAN</Text>
            <Text style={styles.headerTitle}>Presensi Praktikum</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyWrap}>
          <EmptyState
            judul={loading ? 'Memuat data sesi…' : 'Sesi tidak ditemukan'}
            pesan={
              loading
                ? 'Mohon tunggu sebentar.'
                : 'Sesi praktikum ini tidak tersedia untuk kelasmu.'
            }
          />
        </View>
      </View>
    );
  }

  const now = Date.now();
  const statusEfektif = getStatusEfektif(s);
  const belumMulai = !sudahMulai(s, now);
  const waktuHabis = sudahLewat(s, now);

  const hadir = sudahPresensi(s.id, currentUser.id);
  const waktuHadirTeks = hadir ? titikJam(formatJam(hadir.waktuHadir)) : null;
  const izinSaya = getIzinBySesiPraktikan(s.id, currentUser.id);

  // Tentukan status kartu pemeriksaan lokasi
  const statusKartuLokasi: StatusPemeriksaanLokasi = (() => {
    if (!s.labId || !punyaLabValid) return 'lab-belum-diatur';
    if (statusLokasiHook === 'izin-ditolak') return 'izin-ditolak';
    if (statusLokasiHook === 'gps-mati') return 'gps-mati';
    if (statusLokasiHook === 'koordinat-belum-ada') return 'koordinat-belum-ada';
    if (statusLokasiHook === 'error') return 'error';
    if (statusLokasiHook === 'memuat' || jarakMeter === null) return 'memuat';
    if (labSesi && jarakMeter <= labSesi.radius) return 'dalam-radius';
    return 'luar-radius';
  })();

  const sesiBisaPresensi =
    statusEfektif === 'DIBUKA' && !belumMulai && !waktuHabis && !hadir && !izinSaya;

  const lokasiSiapSubmit =
    statusKartuLokasi === 'dalam-radius' && punyaKoordinatValid;

  const tombolKonfirmasiNonaktif =
    !sesiBisaPresensi || !lokasiSiapSubmit || !setujuHadir || memproses;

  const labelTombolUtama = (() => {
    if (memproses) return 'Memverifikasi & Mencatat…';
    if (hadir) return `Sudah Presensi · ${waktuHadirTeks}`;
    if (izinSaya) return `Sudah Mengajukan Izin (${izinSaya.status})`;
    if (waktuHabis) return 'Waktu presensi telah berakhir';
    if (s.status === 'SELESAI' || statusEfektif === 'SELESAI') {
      return 'Sesi telah ditutup';
    }
    if (belumMulai) return 'Sesi belum dimulai';
    if (statusEfektif !== 'DIBUKA') return 'Sesi belum dibuka asisten';
    if (statusKartuLokasi === 'luar-radius') return 'Di luar radius laboratorium';
    if (statusKartuLokasi === 'izin-ditolak') return 'Izin lokasi diperlukan';
    if (statusKartuLokasi === 'gps-mati') return 'Aktifkan GPS untuk presensi';
    if (statusKartuLokasi === 'memuat' || statusKartuLokasi === 'koordinat-belum-ada') {
      return 'Menunggu koordinat GPS…';
    }
    if (statusKartuLokasi === 'lab-belum-diatur') {
      return 'Lokasi lab belum diatur';
    }
    return 'Konfirmasi Presensi Sekarang';
  })();

  const handlePresensi = async () => {
    if (memproses || hadir) return;

    setMemproses(true);
    try {
      const hasil = await markAttendance(s.id, koordinat);
      setMemproses(false);

      if (hasil.ok) {
        const jarakTeks =
          typeof hasil.jarak === 'number' ? ` (${hasil.jarak} m dari lab)` : '';
        showToast(`Presensi berhasil dicatat${jarakTeks}.`);
        return;
      }

      const infoGalat = terjemahkanAlasanTolak(hasil.alasan, {
        waktuHadirPertama: waktuHadirTeks,
        jarakSaatIni: jarakMeter,
        radiusLab: labSesi?.radius ?? null,
        jamMulai: s.jamMulai,
        jamSelesai: s.jamSelesai,
      });
      setGalatModal(infoGalat);
    } catch {
      setMemproses(false);
      setGalatModal(
        terjemahkanAlasanTolak('JARINGAN', {
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
          accessibilityLabel="Kembali"
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
            VERIFIKASI KEHADIRAN
          </Text>
          <Text
            style={[styles.headerTitle, { color: themeColors.textPrimary }]}
            numberOfLines={1}
          >
            Presensi Praktikum
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka peta laboratorium"
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
                SESI PRAKTIKUM
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

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Users size={15} color={themeColors.textMuted} />
              <Text
                style={[styles.metaText, { color: themeColors.textSecondary }]}
              >
                Kelas {s.kelas}
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
                Waktu presensi telah berakhir (jadwal selesai pukul{' '}
                {titikJam(s.jamSelesai)} WIB).
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
                Sesi belum dimulai. Presensi baru dapat dilakukan mulai pukul{' '}
                {titikJam(s.jamMulai)} WIB.
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
                  ? 'Sesi ini telah ditutup oleh asisten.'
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
          <View style={styles.attendedCard}>
            <View style={styles.attendedHeader}>
              <CheckCircle2 size={22} color={colors.radiusInsideFg} />
              <View style={styles.attendedHeaderCopy}>
                <Text style={styles.attendedTitle}>
                  Presensi Berhasil Tercatat
                </Text>
                <Text style={styles.attendedSub}>
                  Tercatat pada pukul {waktuHadirTeks} WIB
                </Text>
              </View>
            </View>

            <View style={styles.attendedMetaRow}>
              <View style={styles.attendedMetaItem}>
                <Compass size={14} color={colors.radiusInsideFg} />
                <Text style={styles.attendedMetaText}>
                  Jarak tercatat:{' '}
                  {typeof hadir.jarak === 'number'
                    ? `${Math.round(hadir.jarak)} m dari lab`
                    : 'Terverifikasi'}
                </Text>
              </View>
              <View style={styles.attendedMetaItem}>
                <ShieldCheck size={14} color={colors.radiusInsideFg} />
                <Text style={styles.attendedMetaText}>
                  {currentUser.nama} ({currentUser.nim ?? '-'})
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* 4. Pernyataan Kehadiran & Tombol Konfirmasi */
          <View
            style={[
              styles.confirmCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
              KONFIRMASI KEHADIRAN
            </Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: setujuHadir,
                disabled: !sesiBisaPresensi || memproses,
              }}
              disabled={!sesiBisaPresensi || memproses}
              onPress={() => setSetujuHadir((v) => !v)}
              style={styles.checkboxRow}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    borderColor: setujuHadir
                      ? themeColors.primary
                      : themeColors.borderDashed,
                    backgroundColor: setujuHadir
                      ? themeColors.primary
                      : themeColors.background,
                  },
                ]}
              >
                {setujuHadir ? (
                  <Check size={14} color={themeColors.onPrimary} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.checkboxLabel,
                  { color: themeColors.textPrimary },
                ]}
              >
                Saya menyatakan hadir secara langsung di ruang laboratorium pada
                sesi praktikum ini.
              </Text>
            </Pressable>

            <Tombol
              variant="primer"
              loading={memproses}
              disabled={tombolKonfirmasiNonaktif}
              icon={
                !sesiBisaPresensi || !lokasiSiapSubmit ? (
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
        kicker="VERIFIKASI PRESENSI"
        judul={galatModal?.judul ?? ''}
        onClose={() => setGalatModal(null)}
        footer={
          <Tombol variant="sekunder" onPress={() => setGalatModal(null)}>
            Tutup
          </Tombol>
        }
      >
        <View style={styles.errorRow}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>
          <Text style={styles.errorPesan}>{galatModal?.pesan}</Text>
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
  iconBtnPressed: {
    opacity: 0.75,
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
    backgroundColor: colors.gpsOffBg,
    borderWidth: 1,
    borderColor: colors.gpsOffBorder,
  },
  timeNoticeWarnText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.gpsOffFg,
  },
  timeNoticeDanger: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2 + 2,
    borderRadius: radius.button,
    backgroundColor: colors.radiusOutsideBg,
    borderWidth: 1,
    borderColor: colors.radiusOutsideBorder,
  },
  timeNoticeDangerText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.radiusOutsideFg,
  },
  attendedCard: {
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.radiusInsideBorder,
    backgroundColor: colors.radiusInsideBg,
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
    color: colors.radiusInsideFg,
  },
  attendedSub: {
    ...type.caption,
    color: colors.radiusInsideFg,
  },
  attendedMetaRow: {
    gap: 6,
    paddingTop: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.radiusInsideBorder,
  },
  attendedMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendedMetaText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.radiusInsideFg,
  },
  confirmCard: {
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.s3 + 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    padding: spacing.s3,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderDashed,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: colors.graphite,
    borderColor: colors.graphite,
  },
  checkboxLabel: {
    ...type.caption,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
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
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    ...type.bodyStrong,
    color: colors.errorFg,
  },
  errorPesan: {
    ...type.body,
    color: colors.textPrimary,
    flex: 1,
  },
});
