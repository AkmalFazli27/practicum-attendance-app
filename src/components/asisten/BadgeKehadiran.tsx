import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/context/PreferencesContext';
import { fontFamily, radius, spacing } from '@/theme/tokens';

export function BadgeKehadiran({
  status,
  menit,
}: {
  status?: 'TEPAT_WAKTU' | 'TERLAMBAT';
  menit?: number;
}) {
  const { t } = useTranslation();
    const { themeColors: tc } = usePreferences();
    if (!status) return null;
    const telat = status === 'TERLAMBAT';
    const label = telat
    ? menit
        ? t('asprak.lateMinutesBadge', { menit })
        : t('status.terlambat')
    : t('status.tepatWaktu');

  return (
    <View
      style={[
        s.badge,
        {
          backgroundColor: telat ? tc.kehadiranTerlambatBg : tc.kehadiranTepatWaktuBg,
        },
      ]}
    >
      <Text
        style={[
          s.teks,
          { color: telat ? tc.kehadiranTerlambatFg : tc.kehadiranTepatWaktuFg },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.s2 + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  teks: { fontSize: 10, lineHeight: 14, fontFamily: fontFamily.bold },
});