import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { useSession } from '@/context/SessionContext';
import { colors } from '@/theme/tokens';

export default function PraktikanLayout() {
  const { currentUser } = useSession();
  const diizinkan = currentUser?.peran === 'praktikan';

  useEffect(() => {
    if (!diizinkan) {
      router.replace('/login');
    }
  }, [diizinkan]);

  if (!diizinkan) return null;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}