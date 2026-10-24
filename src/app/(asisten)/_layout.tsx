import { useEffect } from 'react';
import { router, Stack } from 'expo-router';

import { useSession } from '@/context/SessionContext';
import { colors } from '@/theme/tokens';


export default function AsistenLayout() {
  const { currentUser } = useSession();
  const diizinkan = currentUser?.peran === 'asisten';

  useEffect(() => {
    if (!currentUser) {
      if (router.canDismiss()) {
        router.dismissAll();
      } else {
        router.replace('/');
      }
    } else if (currentUser.peran !== 'asisten') {
      router.replace('/(praktikan)/(tabs)' as any);
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