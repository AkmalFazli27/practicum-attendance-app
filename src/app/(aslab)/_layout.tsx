import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/context/SessionContext';
import { colors } from '@/theme/tokens';

// TODO(sprint4): ganti dengan tipe Peran resmi setelah kontrak PM merge.
type PeranSprint4 = 'praktikan' | 'asisten' | 'aslab';

export default function AslabLayout() {
  const { currentUser, loading } = useSession();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!currentUser) {
    return <Redirect href="/" />;
  }

  const peran = currentUser.peran as PeranSprint4;

  if (peran !== 'aslab') {
    return (
      <Redirect
        href={
          (peran === 'asisten'
            ? '/beranda-asisten'
            : '/beranda-praktikan') as any
        }
      />
    );
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
