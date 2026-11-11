import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui';
import { SessionProvider } from '@/context/SessionContext';
import { useAppFonts } from '@/theme/fonts';

export default function RootLayout() {
  // Memuat font Inter dengan fallback aman ke font sistem
  useAppFonts();

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </ToastProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
