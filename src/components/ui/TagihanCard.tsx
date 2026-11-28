import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/context/PreferencesContext';
import {
  fontFamily,
  radius,
  shadows,
  spacing,
  type,
} from '@/theme/tokens';
import { formatRupiah } from '@/components/praktikan/formatTagihan';
import { StatusPembayaranBadge, type StatusPembayaranTampil } from './StatusPembayaranBadge';
import { Tombol } from './Tombol';

/**
 * Data tampilan tagihan. Sengaja lebih sempit dari tipe `Tagihan` milik PM
 * agar komponen ini tidak bergantung pada kontrak yang belum merge.
 * Tipe `Tagihan` yang lengkap tetap kompatibel secara struktural.
 */
export interface TagihanCardData {
  id: string;
  nominal: number;
  menitTerlambat: number;
  status: StatusPembayaranTampil;
  dibuatPada: string;
  dibayarPada?: string;
}

export interface TagihanCardProps {
  tagihan: TagihanCardData;
  judul: string;
  subjudul?: string;
  onPress?: () => void;
  onBayar?: () => void;
  loadingBayar?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function TagihanCard({
  tagihan,
  judul,
  subjudul,
  onPress,
  onBayar,
  loadingBayar = false,
  style,
}: TagihanCardProps) {
  const { themeColors } = usePreferences();
  const { t } = useTranslation();
  const bisaBayar =
    tagihan.status === 'UNPAID' ||
    tagihan.status === 'FAILED' ||
    tagihan.status === 'failed';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [
          styles.content,
          pressed && onPress ? styles.pressed : null,
        ]}
      >
        <View style={styles.topRow}>
          <Text
            style={[styles.title, { color: themeColors.textPrimary }]}
            numberOfLines={1}
          >
            {judul}
          </Text>
          <StatusPembayaranBadge status={tagihan.status} />
        </View>

        {subjudul ? (
          <Text
            style={[styles.subtitle, { color: themeColors.textSecondary }]}
            numberOfLines={1}
          >
            {subjudul}
          </Text>
        ) : null}

        <View style={styles.amountRow}>
          <Text style={[styles.amount, { color: themeColors.textPrimary }]}>
            {formatRupiah(tagihan.nominal)}
          </Text>
          {tagihan.menitTerlambat > 0 ? (
            <Text style={[styles.late, { color: themeColors.kehadiranTerlambatFg }]}>
              {t('tagihan.lateMinutesShort', { menit: tagihan.menitTerlambat })}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {onBayar && bisaBayar ? (
        <View
          style={[styles.footer, { borderTopColor: themeColors.border }]}
        >
          <Tombol
            variant="primer"
            loading={loadingBayar}
            onPress={onBayar}
          >
            {tagihan.status === 'FAILED' || tagihan.status === 'failed'
              ? t('tagihan.payAgain')
              : t('tagihan.pay')}
          </Tombol>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
  content: {
    padding: spacing.s4,
    gap: spacing.s2,
  },
  pressed: {
    opacity: 0.82,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.s3,
  },
  title: {
    ...type.cardTitle,
    flex: 1,
    fontFamily: fontFamily.bold,
  },
  subtitle: {
    ...type.caption,
    marginTop: -2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.s3,
    marginTop: spacing.s1,
  },
  amount: {
    ...type.h3,
    fontFamily: fontFamily.extrabold,
  },
  late: {
    ...type.micro,
    fontFamily: fontFamily.bold,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    borderTopWidth: 1,
  },
});
