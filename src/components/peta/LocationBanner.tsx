import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AlertTriangle,
  LoaderCircle,
  MapPinOff,
  NavigationOff,
  X,
} from 'lucide-react-native';

import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

export type JenisBannerLokasi =
  | 'izin-ditolak'
  | 'gps-mati'
  | 'tanpa-koordinat'
  | 'lokasi-gagal'
  | 'jaringan';

export interface LocationBannerProps {
  jenis: JenisBannerLokasi;
  pesan?: string;
  onRetry?: () => void;
  onTutup?: () => void;
}

const JUDUL: Record<JenisBannerLokasi, string> = {
  'izin-ditolak': 'Izin lokasi ditolak',
  'gps-mati': 'Lokasi tidak aktif',
  'tanpa-koordinat': 'Mencari lokasi',
  'lokasi-gagal': 'Lokasi gagal dibaca',
  jaringan: 'Koneksi bermasalah',
};

const PESAN: Record<JenisBannerLokasi, string> = {
  'izin-ditolak':
    'Izin lokasi ditolak. Aktifkan lewat Pengaturan untuk melihat posisimu.',
  'gps-mati': 'Layanan lokasi mati. Nyalakan GPS untuk melihat posisimu.',
  'tanpa-koordinat': 'Mencari lokasi…',
  'lokasi-gagal':
    'Lokasi perangkat tidak dapat dibaca. Coba lagi atau periksa pengaturan lokasi.',
  jaringan: 'Tidak dapat memuat data. Periksa koneksi internet.',
};

function IkonBanner({
  jenis,
  warna,
}: {
  jenis: JenisBannerLokasi;
  warna: string;
}) {
  switch (jenis) {
    case 'izin-ditolak':
      return <MapPinOff size={18} color={warna} />;
    case 'gps-mati':
      return <NavigationOff size={18} color={warna} />;
    case 'tanpa-koordinat':
      return <LoaderCircle size={18} color={warna} />;
    case 'lokasi-gagal':
      return <AlertTriangle size={18} color={warna} />;
    case 'jaringan':
      return <AlertTriangle size={18} color={warna} />;
  }
}

export function LocationBanner({
  jenis,
  pesan,
  onRetry,
  onTutup,
}: LocationBannerProps) {
  const tone =
    jenis === 'jaringan' || jenis === 'lokasi-gagal'
      ? {
          bg: colors.errorBg,
          fg: colors.errorFg,
          border: colors.dangerBorder,
        }
      : jenis === 'tanpa-koordinat'
        ? {
            bg: colors.surfaceMuted,
            fg: colors.textSecondary,
            border: colors.border,
          }
        : {
            bg: colors.izinBg,
            fg: colors.izinFg,
            border: colors.border,
          };

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        { backgroundColor: tone.bg, borderColor: tone.border },
      ]}
    >
      <IkonBanner jenis={jenis} warna={tone.fg} />

      <View style={styles.copy}>
        <Text style={[styles.judul, { color: tone.fg }]}>{JUDUL[jenis]}</Text>
        <Text style={[styles.pesan, { color: tone.fg }]}>
          {pesan || PESAN[jenis]}
        </Text>
      </View>

      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Coba lagi"
          onPress={onRetry}
          hitSlop={8}
        >
          <Text style={[styles.aksi, { color: tone.fg }]}>Coba lagi</Text>
        </Pressable>
      ) : null}

      {onTutup ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup pesan"
          onPress={onTutup}
          hitSlop={8}
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
    alignItems: 'flex-start',
    gap: spacing.s2,
    padding: spacing.s3,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  judul: {
    ...type.caption,
    fontFamily: fontFamily.bold,
  },
  pesan: {
    ...type.caption,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
  },
  aksi: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    textDecorationLine: 'underline',
    paddingTop: 1,
  },
});
