import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
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
  const { language } = usePreferences();
  const isEn = language === 'en';

  const label: Record<RentangDashboard, string> = isEn
    ? { hari: 'Day', minggu: 'Week', bulan: 'Month' }
    : { hari: 'Hari', minggu: 'Minggu', bulan: 'Bulan' };

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
