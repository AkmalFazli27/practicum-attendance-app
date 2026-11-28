import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, ReceiptText } from 'lucide-react-native';

import { StatusPembayaranBadge } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import type { Pembayaran } from '@/data/dummy';
import {
  fontFamily,
  radius,
  shadows,
  spacing,
  type,
} from '@/theme/tokens';
import { formatJam } from '@/utils/format';

import { formatRupiah, formatTanggalTagihan } from './formatTagihan';

export interface PembayaranRowProps {
  pembayaran: Pembayaran;
  namaSesi: string;
  tanggalTagihan: string;
  onPress: () => void;
}

function formatWaktuTransaksi(iso: string, isEn: boolean): string {
  const tanggal = formatTanggalTagihan(iso, isEn);
  if (tanggal === '-') return '-';
  if (!iso.includes('T')) return tanggal;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return tanggal;
  return `${tanggal} · ${formatJam(iso)}`;
}

export function PembayaranRow({
  pembayaran,
  namaSesi,
  tanggalTagihan,
  onPress,
}: PembayaranRowProps) {
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const nominalText = formatRupiah(pembayaran.nominal);
  const waktuTransaksi = formatWaktuTransaksi(pembayaran.dibuatPada, isEn);
  const tanggalTagihanText = formatTanggalTagihan(tanggalTagihan, isEn);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${namaSesi}, ${nominalText}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: themeColors.border,
          backgroundColor: pressed
            ? themeColors.surfaceMuted
            : themeColors.surface,
        },
      ]}
    >
      <View
        style={[
          styles.iconTile,
          { backgroundColor: themeColors.primarySoft },
        ]}
      >
        <ReceiptText size={20} color={themeColors.textPrimary} />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text
            style={[styles.title, { color: themeColors.textPrimary }]}
            numberOfLines={1}
          >
            {namaSesi}
          </Text>
          <StatusPembayaranBadge status={pembayaran.status} />
        </View>

        <Text
          style={[styles.billDate, { color: themeColors.textSecondary }]}
          numberOfLines={1}
        >
          {isEn ? 'Bill date' : 'Tanggal tagihan'}: {tanggalTagihanText}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={[styles.amount, { color: themeColors.textPrimary }]}>
            {nominalText}
          </Text>
          <Text
            style={[styles.txTime, { color: themeColors.textMuted }]}
            numberOfLines={1}
          >
            {waktuTransaksi}
            {pembayaran.metode ? ` · ${pembayaran.metode}` : ''}
          </Text>
        </View>
      </View>

      <ChevronRight size={18} color={themeColors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    ...shadows.card,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  title: {
    ...type.cardTitle,
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.bold,
  },
  billDate: {
    ...type.micro,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.s2,
    marginTop: 2,
  },
  amount: {
    ...type.bodyStrong,
    fontFamily: fontFamily.extrabold,
  },
  txTime: {
    ...type.micro,
    flexShrink: 1,
    textAlign: 'right',
  },
});
