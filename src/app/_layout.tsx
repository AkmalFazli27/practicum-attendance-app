import React, { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { ToastProvider } from '@/components/ui';
import {
  PreferencesProvider,
  usePreferences,
} from '@/context/PreferencesContext';
import { SessionProvider, useSession } from '@/context/SessionContext';
import type { Peran } from '@/data/dummy';
import { useNotifications } from '@/hooks/useNotifications';
import { I18nSync } from '@/i18n/I18nSync';
import { useAppFonts } from '@/theme/fonts';

const GRUP_PERAN: Partial<Record<string, Peran>> = {
  '(aslab)': 'aslab',
  '(asisten)': 'asisten',
  '(praktikan)': 'praktikan',
};

function homeUntuk(peran: Peran): string {
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

    const peran = currentUserPeran as Peran;

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
        <I18nSync />
        <SessionProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </SessionProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
