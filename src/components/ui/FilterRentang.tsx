import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { spacing } from '@/theme/tokens';
import { FilterChip } from './FilterChip';

export type RentangDashboard = 'hari' | 'minggu' | 'bulan';

export interface FilterRentangProps {
  value: RentangDashboard;
  onChange: (value: RentangDashboard) => void;
  style?: StyleProp<ViewStyle>;
}

const OPSI: RentangDashboard[] = ['hari', 'minggu', 'bulan'];

export function FilterRentang({ value, onChange, style }: FilterRentangProps) {
  const { t } = useTranslation();

  const label: Record<RentangDashboard, string> = {
    hari: t('filter.day'),
    minggu: t('filter.week'),
    bulan: t('filter.month'),
  };

  return (
    <View style={[styles.row, style]}>
      {OPSI.map((opsi) => (
        <FilterChip
          key={opsi}
          label={label[opsi]}
          aktif={value === opsi}
          onPress={() => onChange(opsi)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.s2,
  },
});
