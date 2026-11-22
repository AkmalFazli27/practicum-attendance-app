import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  MapPin,
  MapPinOff,
  NavigationOff,
  RefreshCw,
  XCircle,
} from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { Tombol } from './Tombol';

export type StatusPemeriksaanLokasi =
  | 'memuat'
  | 'dalam-radius'
  | 'luar-radius'
  | 'izin-ditolak'
  | 'gps-mati'
  | 'koordinat-belum-ada'
  | 'lab-belum-diatur'
  | 'error';

export interface LokasiStatusCardProps {
  status: StatusPemeriksaanLokasi;
  namaLab: string;
  alamatLab?: string;
  radiusMeter?: number;
  jarakMeter?: number | null;
  akurasiMeter?: number | null;
  pesanTambahan?: string | null;
  onRefresh?: () => void;
  onMintaIzin?: () => void;
  style?: StyleProp<ViewStyle>;
}

type StatusConfig = {
  labelBadge: string;
  judul: string;
  deskripsi: string;
  tone: 'inside' | 'outside' | 'warning' | 'neutral';
};

const KONFIG_STATUS_ID: Record<StatusPemeriksaanLokasi, StatusConfig> = {
  memuat: {
    labelBadge: 'Memeriksa GPS…',
    judul: 'Mendeteksi lokasi perangkat',
    deskripsi: 'Mohon tunggu sebentar selagi aplikasi membaca titik koordinatmu.',
    tone: 'neutral',
  },
  'dalam-radius': {
    labelBadge: 'Di Dalam Radius',
    judul: 'Lokasi memenuhi syarat presensi',
    deskripsi:
      'Kamu berada di dalam area jangkauan laboratorium. Silakan konfirmasi presensimu.',
    tone: 'inside',
  },
  'luar-radius': {
    labelBadge: 'Di Luar Radius',
    judul: 'Lokasi di luar jangkauan laboratorium',
    deskripsi:
      'Mendekatlah ke ruang laboratorium hingga jarakmu masuk ke dalam batas radius presensi.',
    tone: 'outside',
  },
  'izin-ditolak': {
    labelBadge: 'Izin Ditolak',
    judul: 'Akses lokasi belum diizinkan',
    deskripsi:
      'Izinkan akses lokasi pada perangkat agar aplikasi dapat memverifikasi posisi presensimu.',
    tone: 'warning',
  },
  'gps-mati': {
    labelBadge: 'GPS Nonaktif',
    judul: 'Layanan lokasi (GPS) perangkat mati',
    deskripsi:
      'Nyalakan GPS di panel pengaturan perangkatmu lalu tekan tombol perbarui lokasi.',
    tone: 'warning',
  },
  'koordinat-belum-ada': {
    labelBadge: 'Sinyal GPS Lemah',
    judul: 'Koordinat lokasi belum terbaca',
    deskripsi:
      'Titik koordinat belum didapatkan. Pastikan GPS aktif dan coba perbarui lokasi.',
    tone: 'warning',
  },
  'lab-belum-diatur': {
    labelBadge: 'Lab Belum Diatur',
    judul: 'Titik koordinat lab belum dikonfigurasi',
    deskripsi:
      'Asisten belum menghubungkan sesi ini dengan titik lokasi laboratorium.',
    tone: 'warning',
  },
  error: {
    labelBadge: 'Gagal Membaca GPS',
    judul: 'Terjadi kendala pembacaan lokasi',
    deskripsi:
      'Perangkat gagal memperoleh posisi GPS saat ini. Silakan muat ulang lokasi.',
    tone: 'outside',
  },
};

const KONFIG_STATUS_EN: Record<StatusPemeriksaanLokasi, StatusConfig> = {
  memuat: {
    labelBadge: 'Checking GPS…',
    judul: 'Detecting device location',
    deskripsi: 'Please wait while the app reads your GPS coordinates.',
    tone: 'neutral',
  },
  'dalam-radius': {
    labelBadge: 'Within Radius',
    judul: 'Location eligible for attendance',
    deskripsi:
      'You are within the laboratory range. You may now confirm your attendance.',
    tone: 'inside',
  },
  'luar-radius': {
    labelBadge: 'Outside Radius',
    judul: 'Location outside laboratory range',
    deskripsi:
      'Move closer to the laboratory until your distance is within the attendance radius.',
    tone: 'outside',
  },
  'izin-ditolak': {
    labelBadge: 'Permission Denied',
    judul: 'Location access not granted',
    deskripsi:
      'Allow location access on your device so the app can verify your attendance position.',
    tone: 'warning',
  },
  'gps-mati': {
    labelBadge: 'GPS Disabled',
    judul: 'Device location service (GPS) is off',
    deskripsi:
      'Enable GPS in your device settings, then tap refresh location.',
    tone: 'warning',
  },
  'koordinat-belum-ada': {
    labelBadge: 'Weak GPS Signal',
    judul: 'Coordinates not yet available',
    deskripsi:
      'GPS coordinates could not be acquired yet. Make sure GPS is on and try refreshing.',
    tone: 'warning',
  },
  'lab-belum-diatur': {
    labelBadge: 'Lab Not Configured',
    judul: 'Lab coordinates are not set',
    deskripsi:
      'The assistant has not linked this session to a laboratory location yet.',
    tone: 'warning',
  },
  error: {
    labelBadge: 'GPS Read Failed',
    judul: 'Unable to read location',
    deskripsi:
      'The device failed to get the current GPS position. Please refresh your location.',
    tone: 'outside',
  },
};

function formatJarak(meter?: number | null): string {
  if (meter === null || meter === undefined || !Number.isFinite(meter)) {
    return '—';
  }
  const bulat = Math.max(0, Math.round(meter));
  if (bulat >= 1000) {
    return `${(bulat / 1000).toFixed(2)} km (${bulat} m)`;
  }
  return `${bulat} m`;
}

export function LokasiStatusCard({
  status,
  namaLab,
  alamatLab,
  radiusMeter,
  jarakMeter,
  akurasiMeter,
  pesanTambahan,
  onRefresh,
  onMintaIzin,
  style,
}: LokasiStatusCardProps) {
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const cfg = (isEn ? KONFIG_STATUS_EN : KONFIG_STATUS_ID)[status];

  const palette =
    cfg.tone === 'inside'
      ? {
          bg: themeColors.radiusInsideBg,
          fg: themeColors.radiusInsideFg,
          border: themeColors.radiusInsideBorder,
        }
      : cfg.tone === 'outside'
        ? {
            bg: themeColors.radiusOutsideBg,
            fg: themeColors.radiusOutsideFg,
            border: themeColors.radiusOutsideBorder,
          }
        : cfg.tone === 'warning'
          ? {
              bg: themeColors.gpsOffBg,
              fg: themeColors.gpsOffFg,
              border: themeColors.gpsOffBorder,
            }
          : {
              bg: themeColors.lokasiMemuatBg,
              fg: themeColors.lokasiMemuatFg,
              border: themeColors.border,
            };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: themeColors.border,
          backgroundColor: themeColors.surface,
        },
        style,
      ]}
    >
      {/* Baris Header Status */}
      <View style={styles.topRow}>
        <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
          {isEn ? 'LAB LOCATION VERIFICATION' : 'VERIFIKASI LOKASI LAB'}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: palette.bg, borderColor: palette.border },
          ]}
        >
          {status === 'memuat' ? (
            <ActivityIndicator size="small" color={palette.fg} />
          ) : status === 'dalam-radius' ? (
            <CheckCircle2 size={14} color={palette.fg} />
          ) : status === 'luar-radius' || status === 'error' ? (
            <XCircle size={14} color={palette.fg} />
          ) : status === 'izin-ditolak' ? (
            <MapPinOff size={14} color={palette.fg} />
          ) : status === 'gps-mati' ? (
            <NavigationOff size={14} color={palette.fg} />
          ) : (
            <AlertTriangle size={14} color={palette.fg} />
          )}
          <Text style={[styles.statusBadgeText, { color: palette.fg }]}>
            {cfg.labelBadge}
          </Text>
        </View>
      </View>

      {/* Judul & Deskripsi Status */}
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>
        {cfg.judul}
      </Text>
      <Text style={[styles.desc, { color: themeColors.textSecondary }]}>
        {pesanTambahan || cfg.deskripsi}
      </Text>

      {/* Metrik Jarak & Radius */}
      <View style={styles.metricsRow}>
        <View
          style={[
            styles.metricBox,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.metricHeader}>
            <Compass size={14} color={themeColors.textMuted} />
            <Text
              style={[styles.metricLabel, { color: themeColors.textMuted }]}
            >
              {isEn ? 'Distance to Lab' : 'Jarakmu ke Lab'}
            </Text>
          </View>
          <Text
            style={[
              styles.metricValue,
              { color: themeColors.textPrimary },
              status === 'dalam-radius' && {
                color: themeColors.radiusInsideFg,
              },
              status === 'luar-radius' && {
                color: themeColors.radiusOutsideFg,
              },
            ]}
          >
            {formatJarak(jarakMeter)}
          </Text>
          {typeof akurasiMeter === 'number' && Number.isFinite(akurasiMeter) ? (
            <Text style={[styles.metricSub, { color: themeColors.textMuted }]}>
              {isEn ? 'GPS Accuracy' : 'Akurasi GPS'} ±{Math.round(akurasiMeter)} m
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.metricBox,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.metricHeader}>
            <MapPin size={14} color={themeColors.textMuted} />
            <Text
              style={[styles.metricLabel, { color: themeColors.textMuted }]}
            >
              {isEn ? 'Lab Radius Limit' : 'Batas Radius Lab'}
            </Text>
          </View>
          <Text
            style={[styles.metricValue, { color: themeColors.textPrimary }]}
          >
            {typeof radiusMeter === 'number' && Number.isFinite(radiusMeter)
              ? `≤ ${radiusMeter} m`
              : isEn
                ? 'Not set'
                : 'Belum diatur'}
          </Text>
          <Text
            style={[styles.metricSub, { color: themeColors.textMuted }]}
            numberOfLines={1}
          >
            {namaLab || (isEn ? 'Laboratory' : 'Laboratorium')}
          </Text>
        </View>
      </View>

      {alamatLab ? (
        <View
          style={[styles.addressRow, { borderTopColor: themeColors.border }]}
        >
          <MapPin size={14} color={themeColors.textMuted} />
          <Text
            style={[styles.addressText, { color: themeColors.textSecondary }]}
            numberOfLines={2}
          >
            {namaLab} · {alamatLab}
          </Text>
        </View>
      ) : null}

      {/* Tombol Aksi Pemulihan Izin / Muat Ulang GPS */}
      {status === 'izin-ditolak' && onMintaIzin ? (
        <Tombol
          variant="sekunder"
          onPress={onMintaIzin}
          icon={<MapPin size={16} color={themeColors.textPrimary} />}
          style={styles.actionBtn}
        >
          {isEn ? 'Allow location access' : 'Izinkan akses lokasi'}
        </Tombol>
      ) : onRefresh && status !== 'memuat' ? (
        <Tombol
          variant="sekunder"
          onPress={onRefresh}
          icon={<RefreshCw size={16} color={themeColors.textPrimary} />}
          style={styles.actionBtn}
        >
          {isEn ? 'Refresh location' : 'Perbarui titik lokasi'}
        </Tombol>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.s3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.s3,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    ...type.micro,
    fontFamily: fontFamily.bold,
  },
  title: {
    ...type.h3,
    color: colors.textPrimary,
  },
  desc: {
    ...type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.s2 + 2,
    marginTop: 2,
  },
  metricBox: {
    flex: 1,
    padding: spacing.s3,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricLabel: {
    ...type.micro,
    color: colors.textMuted,
  },
  metricValue: {
    ...type.h3,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
  },
  metricSub: {
    ...type.micro,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.s1,
  },
  addressText: {
    ...type.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  actionBtn: {
    marginTop: spacing.s1,
  },
});
