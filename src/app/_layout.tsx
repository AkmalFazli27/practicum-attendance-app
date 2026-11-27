import React, { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui';
import {
  PreferencesProvider,
  usePreferences,
} from '@/context/PreferencesContext';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppFonts } from '@/theme/fonts';

// TODO(sprint4): ganti dengan tipe Peran resmi setelah kontrak PM merge.
type PeranSprint4 = 'praktikan' | 'asisten' | 'aslab';

const GRUP_PERAN: Partial<Record<string, PeranSprint4>> = {
  '(aslab)': 'aslab',
  '(asisten)': 'asisten',
  '(praktikan)': 'praktikan',
};

function homeUntuk(peran: PeranSprint4): string {
  if (peran === 'aslab') return '/(aslab)/(tabs)/beranda-aslab';
  if (peran === 'asisten') return '/(asisten)/(tabs)/beranda-asisten';
  return '/(praktikan)/(tabs)/beranda-praktikan';
}

function RoleGate() {
  const { currentUser, loading } = useSession();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  const currentUserId = currentUser?.id;
  const currentUserPeran = currentUser?.peran;
  const grup = segments[0] as string | undefined;
  const peranGrup = grup ? GRUP_PERAN[grup] : undefined;

  useEffect(() => {
    if (loading) return;

    if (!currentUserId) {
      if (peranGrup) {
        router.replace('/' as any);
      }
      return;
    }

    if (!currentUserPeran) return;

    const peran = currentUserPeran as PeranSprint4;

    if (!peranGrup) {
      if (pathname === '/' || pathname === '/login') {
        router.replace(homeUntuk(peran) as any);
      }
      return;
    }

    if (peranGrup !== peran) {
      router.replace(homeUntuk(peran) as any);
    }
  }, [
    loading,
    currentUserId,
    currentUserPeran,
    grup,
    peranGrup,
    pathname,
    router,
  ]);

  return null;
}

function AppShell() {
  useNotifications();
  const { isDark } = usePreferences();

  return (
    <>
      <RoleGate />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  // Memuat font Inter dengan fallback aman ke font sistem
  useAppFonts();

  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <SessionProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </SessionProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
