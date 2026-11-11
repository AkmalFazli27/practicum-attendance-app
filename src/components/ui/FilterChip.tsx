import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

export interface FilterChipProps {
  label: string;
  aktif: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function FilterChip({ label, aktif, onPress, style }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: aktif }}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        aktif
          ? styles.chipAktif
          : pressed
            ? styles.chipInaktifPressed
            : styles.chipInaktif,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          aktif ? styles.textAktif : styles.textInaktif,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  chipAktif: {
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: colors.graphite,
  },
  chipInaktif: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipInaktifPressed: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...type.caption,
  },
  textAktif: {
    color: colors.onGraphite,
    fontFamily: fontFamily.semibold,
  },
  textInaktif: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semibold,
  },
});
