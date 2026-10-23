import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/context/SessionContext';
import { colors } from '@/theme/tokens';

export default function PraktikanLayout() {
  const { currentUser } = useSession();

  if (!currentUser) return <Redirect href="/" />;
  if (currentUser.peran !== 'praktikan') return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}