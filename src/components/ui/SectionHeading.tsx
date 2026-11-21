import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { colors, spacing, type } from '@/theme/tokens';

export interface SectionHeadingProps {
  kicker?: string;
  title: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeading({
  kicker,
  title,
  right,
  style,
}: SectionHeadingProps) {
  const { themeColors } = usePreferences();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {kicker && (
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {kicker}
          </Text>
        )}
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.s3,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  title: {
    ...type.h3,
    color: colors.textPrimary,
  },
});

