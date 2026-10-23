import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, layout, radius, spacing, type } from '@/theme/tokens';

export type TombolVariant = 'primer' | 'sekunder' | 'graphite' | 'ghost';

export interface TombolProps {
  variant?: TombolVariant;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Tombol({
  variant = 'primer',
  loading = false,
  disabled = false,
  onPress,
  children,
  style,
  textStyle,
}: TombolProps) {
  const isDisabled = disabled || loading;

  const getVariantStyles = (pressed: boolean) => {
    if (isDisabled) {
      if (variant === 'ghost') {
        return {
          container: styles.ghostDisabled,
          text: styles.ghostDisabledText,
          indicator: colors.disabledText,
        };
      }
      return {
        container: styles.disabledContainer,
        text: styles.disabledText,
        indicator: colors.disabledText,
      };
    }

    switch (variant) {
      case 'primer':
        return {
          container: pressed ? styles.primerPressed : styles.primer,
          text: styles.primerText,
          indicator: colors.onPrimary,
        };
      case 'graphite':
        return {
          container: pressed ? styles.graphitePressed : styles.graphite,
          text: styles.graphiteText,
          indicator: colors.onGraphite,
        };
      case 'sekunder':
        return {
          container: pressed ? styles.sekunderPressed : styles.sekunder,
          text: styles.sekunderText,
          indicator: colors.textPrimary,
        };
      case 'ghost':
        return {
          container: pressed ? styles.ghostPressed : styles.ghost,
          text: styles.ghostText,
          indicator: colors.textPrimary,
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
          <>
            {loading && (
              <ActivityIndicator
                size="small"
                color={currentStyle.indicator}
                style={styles.spinner}
              />
            )}
            {typeof children === 'string' ? (
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
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    height: layout.buttonHeight,
    minHeight: layout.touchTarget,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s5,
    gap: spacing.s2,
  },
  baseText: {
    ...type.bodyStrong,
    textAlign: 'center',
  },
  spinner: {
    marginRight: spacing.s1,
  },
  textLoading: {
    opacity: 0.8,
  },

  // Primer (Lime)
  primer: {
    backgroundColor: colors.primary,
  },
  primerPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primerText: {
    color: colors.onPrimary,
  },

  // Graphite (Dark)
  graphite: {
    backgroundColor: colors.graphite,
  },
  graphitePressed: {
    backgroundColor: '#2A2E2E',
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

  // Ghost (Transparent)
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  ghostText: {
    color: colors.textPrimary,
  },

  // Disabled states
  disabledContainer: {
    backgroundColor: colors.disabledBg,
    borderWidth: 0,
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
