import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';

export type TombolVariant = 'primer' | 'sekunder' | 'graphite' | 'ghost' | 'danger';

export interface TombolProps {
  variant?: TombolVariant;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Tombol({
  variant = 'primer',
  loading = false,
  disabled = false,
  onPress,
  children,
  icon,
  rightIcon,
  style,
  textStyle,
}: TombolProps) {
  const { themeColors } = usePreferences();
  const isDisabled = disabled || loading;

  const getVariantStyles = (pressed: boolean) => {
    if (isDisabled) {
      if (variant === 'ghost') {
        return {
          container: styles.ghostDisabled,
          text: { color: themeColors.disabledText },
          indicator: themeColors.disabledText,
        };
      }
      return {
        container: {
          backgroundColor: themeColors.disabledBg,
          borderWidth: 1,
          borderColor: themeColors.border,
        },
        text: { color: themeColors.disabledText },
        indicator: themeColors.disabledText,
      };
    }

    switch (variant) {
      case 'primer':
        return {
          container: {
            backgroundColor: pressed
              ? themeColors.primaryPressed
              : themeColors.primary,
          },
          text: { color: themeColors.onPrimary },
          indicator: themeColors.onPrimary,
        };
      case 'graphite':
        return {
          container: {
            backgroundColor: pressed
              ? themeColors.graphiteSurface
              : themeColors.graphite,
          },
          text: { color: themeColors.onGraphite },
          indicator: themeColors.onGraphite,
        };
      case 'sekunder':
        return {
          container: {
            backgroundColor: pressed
              ? themeColors.surfaceMuted
              : themeColors.surface,
            borderWidth: 1,
            borderColor: themeColors.border,
          },
          text: { color: themeColors.textPrimary },
          indicator: themeColors.textPrimary,
        };
      case 'danger':
        return {
          container: {
            backgroundColor: themeColors.errorBg,
            borderWidth: 1,
            borderColor: themeColors.dangerBorder,
            opacity: pressed ? 0.82 : 1,
          },
          text: { color: themeColors.errorFg },
          indicator: themeColors.errorFg,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: pressed
              ? themeColors.surfaceMuted
              : 'transparent',
          },
          text: { color: themeColors.textPrimary },
          indicator: themeColors.textPrimary,
        };
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.baseButton,
        getVariantStyles(pressed).container,
        style,
      ]}
    >
      {({ pressed }) => {
        const currentStyle = getVariantStyles(pressed);
        return (
          <View style={styles.contentRow}>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={currentStyle.indicator}
                style={styles.spinner}
              />
            ) : (
              icon
            )}
            {typeof children === 'string' || typeof children === 'number' ? (
              <Text
                style={[
                  styles.baseText,
                  currentStyle.text,
                  loading && styles.textLoading,
                  textStyle,
                ]}
              >
                {children}
              </Text>
            ) : (
              children
            )}
            {!loading && rightIcon}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    minHeight: layout.buttonHeight,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
  },
  baseText: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  spinner: {
    marginRight: 2,
  },
  textLoading: {
    opacity: 0.85,
  },

  // Primer (Lime)
  primer: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primerPressed: {
    backgroundColor: colors.primaryPressed,
    borderWidth: 1,
    borderColor: colors.primaryPressed,
  },
  primerText: {
    color: colors.onPrimary,
  },

  // Graphite (Dark)
  graphite: {
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: colors.graphite,
  },
  graphitePressed: {
    backgroundColor: colors.graphiteSurface,
    borderWidth: 1,
    borderColor: colors.graphiteSurface,
  },
  graphiteText: {
    color: colors.onGraphite,
  },

  // Sekunder (Outline White)
  sekunder: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sekunderPressed: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sekunderText: {
    color: colors.textPrimary,
  },

  // Danger (Soft Red)
  danger: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  dangerPressed: {
    backgroundColor: colors.dangerBorder,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  dangerText: {
    color: colors.errorFg,
  },

  // Ghost (Transparent)
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  ghostText: {
    color: colors.textSecondary,
  },

  // Disabled states
  disabledContainer: {
    backgroundColor: colors.disabledBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledText: {
    color: colors.disabledText,
  },
  ghostDisabled: {
    backgroundColor: 'transparent',
  },
  ghostDisabledText: {
    color: colors.disabledText,
  },
});
