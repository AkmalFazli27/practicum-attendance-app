import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/context/SessionContext';
import { colors } from '@/theme/tokens';

export default function AsistenLayout() {
  const { currentUser } = useSession();

  if (!currentUser) {
    return <Redirect href="/" />;
  }

  if (currentUser.peran !== 'asisten') {
    return <Redirect href={'/(praktikan)/(tabs)/jadwal' as any} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}