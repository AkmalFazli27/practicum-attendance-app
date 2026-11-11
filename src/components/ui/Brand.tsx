import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, spacing } from '@/theme/tokens';

export interface BrandProps {
  compact?: boolean;
  large?: boolean;
  onDark?: boolean;
  showWordmark?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Brand({
  compact = false,
  large = false,
  onDark = false,
  showWordmark = true,
  style,
}: BrandProps) {
  return (
    <View style={[styles.row, style]}>
      <View
        style={[
          styles.mark,
          large && styles.markLarge,
          onDark && styles.markOnDark,
        ]}
      >
        <View style={[styles.arch, large && styles.archLarge]} />
        <View style={[styles.pillar, large && styles.pillarLarge]} />
      </View>
      {showWordmark && (
        <Text
          style={[
            styles.wordmark,
            compact && styles.wordmarkCompact,
            onDark && styles.wordmarkOnDark,
          ]}
        >
          TapIn
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2 + 2,
  },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  markOnDark: {
    backgroundColor: colors.graphiteSurface,
    borderWidth: 1,
    borderColor: 'rgba(196, 241, 91, 0.2)',
  },
  markLarge: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  arch: {
    position: 'absolute',
    top: 7,
    width: 16,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
  },
  archLarge: {
    top: 11,
    width: 24,
    height: 13,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
  },
  pillar: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 14,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  pillarLarge: {
    bottom: 8,
    width: 7,
    height: 21,
    borderRadius: 4,
  },
  wordmark: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: fontFamily.extrabold,
    letterSpacing: -0.7,
    color: colors.textPrimary,
  },
  wordmarkCompact: {
    fontSize: 21,
    lineHeight: 24,
  },
  wordmarkOnDark: {
    color: colors.onGraphite,
  },
});

