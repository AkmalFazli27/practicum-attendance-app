import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/context/PreferencesContext';
import { type StatusIzin, type StatusSesi } from '@/data/dummy';
import { fontFamily, radius, spacing, type ThemeColors } from '@/theme/tokens';

export type BadgeStatusType =
  | StatusSesi
  | StatusIzin
  | 'ALPHA'
  | 'TEPAT_WAKTU'
  | 'TERLAMBAT';

export interface StatusBadgeProps {
  status: BadgeStatusType;
  style?: StyleProp<ViewStyle>;
}

function getBadgeConfig(
  status: BadgeStatusType,
  tc: ThemeColors,
  t: TFunction,
): { label: string; bg: string; fg: string } {
  switch (status) {
    case 'DIBUKA':
      return {
        label: t('status.openNow'),
        bg: tc.sesiDibukaBg,
        fg: tc.sesiDibukaFg,
      };
    case 'SELESAI':
      return {
        label: t('status.completed'),
        bg: tc.sesiSelesaiBg,
        fg: tc.sesiSelesaiFg,
      };
    case 'MENUNGGU':
      return {
        label: t('status.leavePending'),
        bg: tc.izinBg,
        fg: tc.izinFg,
      };
    case 'DITERIMA':
      return {
        label: t('status.leaveApproved'),
        bg: tc.sesiDibukaBg,
        fg: tc.sesiDibukaFg,
      };
    case 'DITOLAK':
      return {
        label: t('status.leaveRejected'),
        bg: tc.errorBg,
        fg: tc.errorFg,
      };
    case 'ALPHA':
      return {
        label: t('status.alpha'),
        bg: tc.errorBg,
        fg: tc.errorFg,
      };
    case 'TEPAT_WAKTU':
      return {
        label: t('status.tepatWaktu'),
        bg: tc.kehadiranTepatWaktuBg,
        fg: tc.kehadiranTepatWaktuFg,
      };
    case 'TERLAMBAT':
      return {
        label: t('status.terlambat'),
        bg: tc.kehadiranTerlambatBg,
        fg: tc.kehadiranTerlambatFg,
      };
    case 'TERJADWAL':
    default:
      return {
        label: t('status.scheduled'),
        bg: tc.sesiTerjadwalBg,
        fg: tc.sesiTerjadwalFg,
      };
  }
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const { themeColors } = usePreferences();
  const { t } = useTranslation();
  const config = getBadgeConfig(status, themeColors, t);

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
