import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, type } from '@/theme/tokens';

export interface ScoreRingProps {
  value: number;
  label?: string;
  size?: number;
}

export function ScoreRing({
  value,
  label = 'hadir',
  size = 76,
}: ScoreRingProps) {
  const safeVal = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderRightColor: safeVal >= 95 ? colors.primary : colors.surfaceMuted,
          borderTopColor: safeVal === 0 ? colors.surfaceMuted : colors.primary,
          borderLeftColor: safeVal < 25 ? colors.surfaceMuted : colors.primary,
          borderBottomColor: safeVal < 50 ? colors.surfaceMuted : colors.primary,
        },
      ]}
    >
      <Text style={styles.valueText}>{safeVal}%</Text>
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 17,
    lineHeight: 20,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
  },
  labelText: {
    ...type.micro,
    color: colors.textMuted,
    marginTop: 1,
  },
});

