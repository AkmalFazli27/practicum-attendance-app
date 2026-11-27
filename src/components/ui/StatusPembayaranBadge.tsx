import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import {
  fontFamily,
  radius,
  spacing,
  type ThemeColors,
} from '@/theme/tokens';

export type StatusPembayaranTampil =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'DIBEBASKAN'
  | 'pending'
  | 'success'
  | 'failed';

export interface StatusPembayaranBadgeProps {
  status: StatusPembayaranTampil;
  style?: StyleProp<ViewStyle>;
}

function getBadgeConfig(
  status: StatusPembayaranTampil,
  tc: ThemeColors,
  isEn: boolean,
): { label: string; bg: string; fg: string } {
  switch (status) {
    case 'PENDING':
    case 'pending':
      return {
        label: isEn ? 'Awaiting payment' : 'Menunggu pembayaran',
        bg: tc.pembayaranPendingBg,
        fg: tc.pembayaranPendingFg,
      };
    case 'PAID':
    case 'success':
      return {
        label: isEn ? 'Paid' : 'Lunas',
        bg: tc.pembayaranSuccessBg,
        fg: tc.pembayaranSuccessFg,
      };
    case 'FAILED':
    case 'failed':
      return {
        label: isEn ? 'Failed' : 'Gagal',
        bg: tc.pembayaranFailedBg,
        fg: tc.pembayaranFailedFg,
      };
    case 'DIBEBASKAN':
      return {
        label: isEn ? 'Waived' : 'Dibebaskan',
        bg: tc.pembayaranDibebaskanBg,
        fg: tc.pembayaranDibebaskanFg,
      };
    case 'UNPAID':
    default:
      return {
        label: isEn ? 'Unpaid' : 'Belum dibayar',
        bg: tc.pembayaranUnpaidBg,
        fg: tc.pembayaranUnpaidFg,
      };
  }
}

export function StatusPembayaranBadge({
  status,
  style,
}: StatusPembayaranBadgeProps) {
  const { themeColors, language } = usePreferences();
  const config = getBadgeConfig(status, themeColors, language === 'en');

  return (
    <View
      style={[styles.badge, { backgroundColor: config.bg }, style]}
      accessibilityRole="text"
      accessibilityLabel={`Status pembayaran: ${config.label}`}
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
    paddingHorizontal: spacing.s2 + 2,
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
