// src/app/(praktikan)/sesi/[id].tsx  (placeholder, diganti saat FR-06)
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, spacing, type } from '@/theme/tokens';

export default function DetailSesiPraktikan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getSesiById } = useSession();
  const s = getSesiById(id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.s5, paddingTop: insets.top + spacing.s4, gap: spacing.s4 }}>
      <Tombol variant="ghost" onPress={() => router.back()} style={{ alignSelf: 'flex-start' }}>
        ‹ Kembali
      </Tombol>
      <Text style={{ ...type.h1, color: colors.textPrimary }}>{s?.namaPraktikum ?? 'Sesi tidak ditemukan'}</Text>
    </View>
  );
}