import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

export interface MetricCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function MetricCard({
  icon,
  value,
  label,
  dark = false,
  style,
}: MetricCardProps) {
  const { themeColors } = usePreferences();

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: dark ? themeColors.border : themeColors.border,
          backgroundColor: dark ? themeColors.graphite : themeColors.surface,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconTile,
          {
            backgroundColor: dark
              ? themeColors.primary
              : themeColors.primarySoft,
          },
        ]}
      >
        {icon}
      </View>
      <View style={styles.bottomGroup}>
        <Text
          style={[
            styles.value,
            { color: dark ? themeColors.onGraphite : themeColors.textPrimary },
          ]}
        >
          {value}
        </Text>
        <Text
          style={[
            styles.label,
            {
              color: dark
                ? themeColors.textOnDarkMuted
                : themeColors.textMuted,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 138,
    justifyContent: 'space-between',
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardDark: {
    borderColor: colors.graphite,
    backgroundColor: colors.graphite,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDark: {
    backgroundColor: colors.primary,
  },
  iconLight: {
    backgroundColor: colors.primarySoft,
  },
  bottomGroup: {
    marginTop: spacing.s4,
    gap: 4,
  },
  value: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
  },
  valueDark: {
    color: colors.onGraphite,
  },
  label: {
    ...type.caption,
    color: colors.textMuted,
  },
  labelDark: {
    color: colors.textOnDarkMuted,
  },
});

