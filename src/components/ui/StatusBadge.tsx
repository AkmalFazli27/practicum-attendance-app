import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { type StatusIzin, type StatusSesi } from '@/data/dummy';
import { fontFamily, radius, spacing, type ThemeColors } from '@/theme/tokens';

export type BadgeStatusType = StatusSesi | StatusIzin | 'ALPHA';

export interface StatusBadgeProps {
  status: BadgeStatusType;
  style?: StyleProp<ViewStyle>;
}

function getBadgeConfig(
  status: BadgeStatusType,
  tc: ThemeColors,
  isEn: boolean,
): { label: string; bg: string; fg: string } {
  switch (status) {
    case 'DIBUKA':
      return {
        label: isEn ? 'Open now' : 'Sedang dibuka',
        bg: tc.sesiDibukaBg,
        fg: tc.sesiDibukaFg,
      };
    case 'SELESAI':
      return {
        label: isEn ? 'Completed' : 'Selesai',
        bg: tc.sesiSelesaiBg,
        fg: tc.sesiSelesaiFg,
      };
    case 'MENUNGGU':
      return {
        label: isEn ? 'Pending' : 'Menunggu',
        bg: tc.izinBg,
        fg: tc.izinFg,
      };
    case 'DITERIMA':
      return {
        label: isEn ? 'Leave Approved' : 'Izin Diterima',
        bg: tc.sesiDibukaBg,
        fg: tc.sesiDibukaFg,
      };
    case 'DITOLAK':
      return {
        label: isEn ? 'Leave Rejected' : 'Izin Ditolak',
        bg: tc.errorBg,
        fg: tc.errorFg,
      };
    case 'ALPHA':
      return {
        label: isEn ? 'Absent (Alpha)' : 'Alpha',
        bg: tc.errorBg,
        fg: tc.errorFg,
      };
    case 'TERJADWAL':
    default:
      return {
        label: isEn ? 'Scheduled' : 'Terjadwal',
        bg: tc.sesiTerjadwalBg,
        fg: tc.sesiTerjadwalFg,
      };
  }
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const { themeColors, language } = usePreferences();
  const config = getBadgeConfig(status, themeColors, language === 'en');

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
