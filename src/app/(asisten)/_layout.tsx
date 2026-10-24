import { useEffect } from 'react';
import { router, Stack } from 'expo-router';

import { useSession } from '@/context/SessionContext';
import { colors } from '@/theme/tokens';

// Guard peran: DESIGN.md §3.3
export default function AsistenLayout() {
  const { currentUser } = useSession();
  const diizinkan = currentUser?.peran === 'asisten';

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    } else if (currentUser.peran !== 'asisten') {
      router.replace('/(praktikan)' as any);
    }
  }, [currentUser]);

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
