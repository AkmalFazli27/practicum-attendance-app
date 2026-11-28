import React from 'react';
import { Stack } from 'expo-router';

import { usePreferences } from '@/context/PreferencesContext';

export default function AslabLabLayout() {
  const { themeColors } = usePreferences();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: themeColors.background },
      }}
    />
  );
}
