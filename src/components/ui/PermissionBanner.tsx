import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  AlertTriangle,
  BellOff,
  LoaderCircle,
  MapPinOff,
  NavigationOff,
  WifiOff,
  X,
} from 'lucide-react-native';

import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

export type JenisPermissionBanner =
  | 'izin-lokasi-ditolak'
  | 'gps-mati'
  | 'koordinat-belum-ada'
  | 'izin-notifikasi-ditolak'
  | 'jaringan'
  | 'error';

export interface PermissionBannerProps {
  jenis: JenisPermissionBanner;
  judul?: string;
  pesan?: string;
  aksiLabel?: string;
  onAksi?: () => void;
  onTutup?: () => void;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_COPY: Record<
  JenisPermissionBanner,
  { judul: string; pesan: string; aksi: string }
> = {
  'izin-lokasi-ditolak': {
    judul: 'Izin lokasi ditolak',
    pesan:
      'Akses lokasi diperlukan untuk memverifikasi keberadaanmu di laboratorium.',
    aksi: 'Izinkan',
  },
  'gps-mati': {
    judul: 'Layanan lokasi (GPS) mati',
    pesan:
      'Aktifkan GPS pada perangkatmu agar jarak ke laboratorium dapat diperiksa.',
    aksi: 'Coba lagi',
  },
  'koordinat-belum-ada': {
    judul: 'Koordinat lokasi belum tersedia',
    pesan:
      'Sedang membaca sinyal GPS perangkat. Pastikan kamu berada di area dengan sinyal baik.',
    aksi: 'Muat ulang',
  },
  'izin-notifikasi-ditolak': {
    judul: 'Izin notifikasi nonaktif',
    pesan:
      'Aktifkan izin notifikasi di pengaturan agar menerima pemberitahuan sesi dan status izin.',
    aksi: 'Pengaturan',
  },
  jaringan: {
    judul: 'Koneksi jaringan terputus',
    pesan:
      'Tidak dapat terhubung ke server. Periksa koneksi internetmu lalu coba lagi.',
    aksi: 'Coba lagi',
  },
  error: {
    judul: 'Gagal memeriksa perangkat',
    pesan: 'Terjadi kendala saat memeriksa kondisi lokasi perangkat.',
    aksi: 'Coba lagi',
  },
};

function IkonStatus({
  jenis,
  warna,
}: {
  jenis: JenisPermissionBanner;
  warna: string;
}) {
  switch (jenis) {
    case 'izin-lokasi-ditolak':
      return <MapPinOff size={18} color={warna} />;
    case 'gps-mati':
      return <NavigationOff size={18} color={warna} />;
    case 'koordinat-belum-ada':
      return <LoaderCircle size={18} color={warna} />;
    case 'izin-notifikasi-ditolak':
      return <BellOff size={18} color={warna} />;
    case 'jaringan':
      return <WifiOff size={18} color={warna} />;
    case 'error':
      return <AlertTriangle size={18} color={warna} />;
  }
}

export function PermissionBanner({
  jenis,
  judul,
  pesan,
  aksiLabel,
  onAksi,
  onTutup,
  style,
}: PermissionBannerProps) {
  const copy = DEFAULT_COPY[jenis];
  const isDanger = jenis === 'jaringan' || jenis === 'error';
  const isNeutral = jenis === 'koordinat-belum-ada';

  const tone = isDanger
    ? {
        bg: colors.radiusOutsideBg,
        fg: colors.radiusOutsideFg,
        border: colors.radiusOutsideBorder,
      }
    : isNeutral
      ? {
          bg: colors.lokasiMemuatBg,
          fg: colors.lokasiMemuatFg,
          border: colors.border,
        }
      : {
          bg: colors.gpsOffBg,
          fg: colors.gpsOffFg,
          border: colors.gpsOffBorder,
        };

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        { backgroundColor: tone.bg, borderColor: tone.border },
        style,
      ]}
    >
      <View style={styles.iconWrap}>
        <IkonStatus jenis={jenis} warna={tone.fg} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: tone.fg }]}>
          {judul ?? copy.judul}
        </Text>
        <Text style={[styles.message, { color: tone.fg }]}>
          {pesan ?? copy.pesan}
        </Text>
      </View>

      {onAksi ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={aksiLabel ?? copy.aksi}
          onPress={onAksi}
          hitSlop={8}
          style={({ pressed }) => [
            styles.actionBtn,
            { borderColor: tone.fg },
            pressed && styles.actionBtnPressed,
          ]}
        >
          <Text style={[styles.actionText, { color: tone.fg }]}>
            {aksiLabel ?? copy.aksi}
          </Text>
        </Pressable>
      ) : null}

      {onTutup ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup peringatan"
          onPress={onTutup}
          hitSlop={8}
          style={styles.closeBtn}
        >
          <X size={16} color={tone.fg} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingHorizontal: spacing.s3 + 2,
    paddingVertical: spacing.s3,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...type.caption,
    fontFamily: fontFamily.bold,
  },
  message: {
    ...type.caption,
    lineHeight: 16,
  },
  actionBtn: {
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  actionBtnPressed: {
    opacity: 0.78,
  },
  actionText: {
    ...type.micro,
    fontFamily: fontFamily.bold,
  },
  closeBtn: {
    padding: 4,
  },
});
