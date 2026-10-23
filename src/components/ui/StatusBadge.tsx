import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { type StatusSesi } from '@/data/dummy';
import { colors, radius, spacing, type } from '@/theme/tokens';

export interface StatusBadgeProps {
  status: StatusSesi | 'TERJADWAL' | 'DIBUKA' | 'SELESAI';
  style?: StyleProp<ViewStyle>;
}

const BADGE_CONFIG = {
  TERJADWAL: {
    label: 'TERJADWAL',
    bg: colors.sesiTerjadwalBg,
    fg: colors.sesiTerjadwalFg,
    hasDot: false,
  },
  DIBUKA: {
    label: 'DIBUKA',
    bg: colors.sesiDibukaBg,
    fg: colors.sesiDibukaFg,
    hasDot: true,
  },
  SELESAI: {
    label: 'SELESAI',
    bg: colors.sesiSelesaiBg,
    fg: colors.sesiSelesaiFg,
    hasDot: false,
  },
} as const;

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const config = BADGE_CONFIG[status] ?? BADGE_CONFIG.TERJADWAL;

  return (
    <View
      style={[styles.badge, { backgroundColor: config.bg }, style]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
    >
      {config.hasDot && (
        <View style={[styles.dot, { backgroundColor: config.fg }]} />
      )}
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
    paddingVertical: 5,
    borderRadius: radius.badge,
    gap: spacing.s1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...type.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
