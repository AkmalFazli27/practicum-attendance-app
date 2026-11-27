import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
import {
  fontFamily,
  radius,
  shadows,
  spacing,
  type,
} from '@/theme/tokens';
import { formatRupiah } from './formatTagihan';

export interface TagihanRingkasCardProps {
  jumlah: number;
  total: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function TagihanRingkasCard({
  jumlah,
  total,
  onPress,
  style,
}: TagihanRingkasCardProps) {
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';

  const judul = isEn
    ? `${jumlah} outstanding ${jumlah === 1 ? 'bill' : 'bills'}`
    : `${jumlah} tagihan belum selesai`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${judul}. ${formatRupiah(total)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed
            ? themeColors.surfaceMuted
            : themeColors.surface,
          borderColor: themeColors.border,
        },
        style,
      ]}
    >
      <View style={styles.copy}>
        <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
          {isEn ? 'BILLING' : 'TAGIHAN'}
        </Text>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
          {judul}
        </Text>
        <Text style={[styles.total, { color: themeColors.textPrimary }]}>
          {formatRupiah(total)}
        </Text>
        <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>
          {isEn ? 'Total outstanding' : 'Total tertunggak'}
        </Text>
      </View>

      <View
        style={[
          styles.action,
          { borderTopColor: themeColors.border },
        ]}
      >
        <Text style={[styles.actionText, { color: themeColors.textPrimary }]}>
          {isEn ? 'View bills' : 'Lihat tagihan'}
        </Text>
        <ArrowRight size={17} color={themeColors.textPrimary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
  copy: {
    padding: spacing.s4,
    gap: 3,
  },
  kicker: {
    ...type.micro,
    letterSpacing: 1.1,
  },
  title: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
  },
  total: {
    ...type.h2,
    fontFamily: fontFamily.extrabold,
    marginTop: spacing.s2,
  },
  totalLabel: {
    ...type.micro,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    borderTopWidth: 1,
  },
  actionText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
  },
});
