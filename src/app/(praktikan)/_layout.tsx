import { useEffect } from 'react';
import { router, Stack, useRootNavigationState } from 'expo-router';

import { useSession } from '@/context/SessionContext';
import { colors } from '@/theme/tokens';

export default function PraktikanLayout() {
  const { currentUser } = useSession();
  const navState = useRootNavigationState();
  const diizinkan = currentUser?.peran === 'praktikan';

  useEffect(() => {
    if (!navState?.key) return; 

    if (!currentUser) {
      if (router.canDismiss()) {
        router.dismissAll();
      } else {
        router.replace('/');
      }
    } else if (currentUser.peran !== 'praktikan') {
      router.replace('/(asisten)/(tabs)');
    }
  }, [currentUser, navState?.key]);

  if (!navState?.key) return null;
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