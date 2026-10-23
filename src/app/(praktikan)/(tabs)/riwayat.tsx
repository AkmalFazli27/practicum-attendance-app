// src/app/(praktikan)/(tabs)/riwayat.tsx  (placeholder, diganti saat FR-09)
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, type } from '@/theme/tokens';

export default function RiwayatScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.s5, paddingTop: insets.top + spacing.s4 }}>
      <Text style={{ ...type.h1, color: colors.textPrimary }}>Riwayat kehadiran</Text>
    </View>
  );
}