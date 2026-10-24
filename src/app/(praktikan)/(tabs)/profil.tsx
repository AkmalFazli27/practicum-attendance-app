import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, spacing, type } from '@/theme/tokens';

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, logout } = useSession();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.s5, paddingTop: insets.top + spacing.s4, gap: spacing.s4 }}>
      <Text style={{ ...type.h1, color: colors.textPrimary }}>Profil</Text>
      <Text style={{ ...type.body, color: colors.textSecondary }}>
        {currentUser?.nama} · {currentUser?.nim}
      </Text>
      <Tombol
        variant="sekunder"
        onPress={() => {
          logout();
          router.replace('/');
        }}
      >
        Keluar
      </Tombol>
    </View>
  );
}