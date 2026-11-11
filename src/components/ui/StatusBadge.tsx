import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { type StatusIzin, type StatusSesi } from '@/data/dummy';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

export type BadgeStatusType = StatusSesi | StatusIzin;

export interface StatusBadgeProps {
  status: BadgeStatusType;
  style?: StyleProp<ViewStyle>;
}

const BADGE_CONFIG: Record<
  BadgeStatusType,
  { label: string; bg: string; fg: string }
> = {
  TERJADWAL: {
    label: 'Terjadwal',
    bg: colors.sesiTerjadwalBg,
    fg: colors.sesiTerjadwalFg,
  },
  DIBUKA: {
    label: 'Sedang dibuka',
    bg: colors.sesiDibukaBg,
    fg: colors.sesiDibukaFg,
  },
  SELESAI: {
    label: 'Selesai',
    bg: colors.sesiSelesaiBg,
    fg: colors.sesiSelesaiFg,
  },
  MENUNGGU: {
    label: 'Menunggu',
    bg: colors.izinBg,
    fg: colors.izinFg,
  },
  DITERIMA: {
    label: 'Izin Diterima',
    bg: colors.sesiDibukaBg,
    fg: colors.sesiDibukaFg,
  },
  DITOLAK: {
    label: 'Izin Ditolak',
    bg: colors.errorBg,
    fg: colors.errorFg,
  },
};

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const config = BADGE_CONFIG[status] ?? BADGE_CONFIG.TERJADWAL;

  return (
    <View
      style={[styles.badge, { backgroundColor: config.bg }, style]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
    >
      <View style={[styles.dot, { backgroundColor: config.fg }]} />
      <Text style={[styles.text, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    gap: spacing.s1 + 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamily.bold,
  },
});
