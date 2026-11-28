import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';

import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Peran } from '@/data/dummy';

export default function PraktikanLayout() {
  const { currentUser, loading } = useSession();
  const { themeColors } = usePreferences();

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  if (!currentUser) {
    return <Redirect href="/" />;
  }

  const peran = currentUser.peran as Peran;

  if (peran !== 'praktikan') {
    return (
      <Redirect
        href={
          (peran === 'aslab'
            ? '/(aslab)/(tabs)/beranda-aslab'
            : '/beranda-asisten') as any
        }
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: themeColors.background },
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
