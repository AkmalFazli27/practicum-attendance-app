import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui';
import {
  PreferencesProvider,
  usePreferences,
} from '@/context/PreferencesContext';
import { SessionProvider } from '@/context/SessionContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppFonts } from '@/theme/fonts';

function AppShell() {
  useNotifications();
  const { isDark } = usePreferences();

  return (
    <>
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
