import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontFamily, radius, spacing, type } from '@/theme/tokens';

export interface BannerGalatProps {
  pesan: string;
  onTutup: () => void;
}

/** Banner error ringkas untuk alur pembayaran tagihan. */
export function BannerGalat({ pesan, onTutup }: BannerGalatProps) {
  const { themeColors, language } = usePreferences();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          backgroundColor: themeColors.errorBg,
          borderColor: themeColors.dangerBorder,
        },
      ]}
    >
      <AlertTriangle size={17} color={themeColors.errorFg} />
      <Text style={[styles.pesan, { color: themeColors.errorFg }]}>
        {pesan}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={language === 'en' ? 'Dismiss' : 'Tutup'}
        onPress={onTutup}
        hitSlop={8}
        style={styles.tutup}
      >
        <X size={15} color={themeColors.errorFg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2 + 2,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  pesan: {
    ...type.caption,
    flex: 1,
    fontFamily: fontFamily.bold,
  },
  tutup: {
    padding: 2,
  },
});
