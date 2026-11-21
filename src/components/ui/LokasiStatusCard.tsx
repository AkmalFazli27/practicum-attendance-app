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

const KONFIG_STATUS: Record<
  StatusPemeriksaanLokasi,
  {
    labelBadge: string;
    judul: string;
    deskripsi: string;
    tone: 'inside' | 'outside' | 'warning' | 'neutral';
  }
> = {
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
  const cfg = KONFIG_STATUS[status];

  const palette =
    cfg.tone === 'inside'
      ? {
          bg: colors.radiusInsideBg,
          fg: colors.radiusInsideFg,
          border: colors.radiusInsideBorder,
        }
      : cfg.tone === 'outside'
        ? {
            bg: colors.radiusOutsideBg,
            fg: colors.radiusOutsideFg,
            border: colors.radiusOutsideBorder,
          }
        : cfg.tone === 'warning'
          ? {
              bg: colors.gpsOffBg,
              fg: colors.gpsOffFg,
              border: colors.gpsOffBorder,
            }
          : {
              bg: colors.lokasiMemuatBg,
              fg: colors.lokasiMemuatFg,
              border: colors.border,
            };

  return (
    <View style={[styles.card, style]}>
      {/* Baris Header Status */}
      <View style={styles.topRow}>
        <Text style={styles.kicker}>VERIFIKASI LOKASI LAB</Text>
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
      <Text style={styles.title}>{cfg.judul}</Text>
      <Text style={styles.desc}>{pesanTambahan || cfg.deskripsi}</Text>

      {/* Metrik Jarak & Radius */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <View style={styles.metricHeader}>
            <Compass size={14} color={colors.textMuted} />
            <Text style={styles.metricLabel}>Jarakmu ke Lab</Text>
          </View>
          <Text
            style={[
              styles.metricValue,
              status === 'dalam-radius' && { color: colors.radiusInsideFg },
              status === 'luar-radius' && { color: colors.radiusOutsideFg },
            ]}
          >
            {formatJarak(jarakMeter)}
          </Text>
          {typeof akurasiMeter === 'number' && Number.isFinite(akurasiMeter) ? (
            <Text style={styles.metricSub}>
              Akurasi GPS ±{Math.round(akurasiMeter)} m
            </Text>
          ) : null}
        </View>

        <View style={styles.metricBox}>
          <View style={styles.metricHeader}>
            <MapPin size={14} color={colors.textMuted} />
            <Text style={styles.metricLabel}>Batas Radius Lab</Text>
          </View>
          <Text style={styles.metricValue}>
            {typeof radiusMeter === 'number' && Number.isFinite(radiusMeter)
              ? `≤ ${radiusMeter} m`
              : 'Belum diatur'}
          </Text>
          <Text style={styles.metricSub} numberOfLines={1}>
            {namaLab || 'Laboratorium'}
          </Text>
        </View>
      </View>

      {alamatLab ? (
        <View style={styles.addressRow}>
          <MapPin size={14} color={colors.textMuted} />
          <Text style={styles.addressText} numberOfLines={2}>
            {namaLab} · {alamatLab}
          </Text>
        </View>
      ) : null}

      {/* Tombol Aksi Pemulihan Izin / Muat Ulang GPS */}
      {status === 'izin-ditolak' && onMintaIzin ? (
        <Tombol
          variant="sekunder"
          onPress={onMintaIzin}
          icon={<MapPin size={16} color={colors.textPrimary} />}
          style={styles.actionBtn}
        >
          Izinkan akses lokasi
        </Tombol>
      ) : onRefresh && status !== 'memuat' ? (
        <Tombol
          variant="sekunder"
          onPress={onRefresh}
          icon={<RefreshCw size={16} color={colors.textPrimary} />}
          style={styles.actionBtn}
        >
          Perbarui titik lokasi
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
