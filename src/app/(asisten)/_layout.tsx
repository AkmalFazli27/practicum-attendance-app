import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/context/SessionContext';
import { colors } from '@/theme/tokens';

export default function AsistenLayout() {
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

  if (currentUser.peran !== 'asisten') {
    return <Redirect href={'/beranda-praktikan' as any} />;
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
