import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { layout, spacing, type } from '@/theme/tokens';

// STUB P1 — isi final milik P3. Jangan ubah layout/tab.
export default function BerandaAslabScreen() {
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleWrap}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {isEn ? 'ASLAB AREA' : 'AREA ASLAB'}
          </Text>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            {isEn ? 'Aslab dashboard' : 'Beranda Aslab'}
          </Text>
        </View>

        <EmptyState
          judul={isEn ? 'Dashboard coming soon' : 'Dashboard segera hadir'}
          pesan={
            isEn
              ? 'Lab status, schedules, activity history, and finance history will be filled by P3.'
              : 'Status lab, jadwal, riwayat kegiatan, dan riwayat keuangan akan diisi P3.'
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s5,
    paddingBottom: layout.tabContentBottomPadding,
    gap: spacing.s4,
  },
  titleWrap: {
    gap: 2,
  },
  kicker: {
    ...type.micro,
    letterSpacing: 1.1,
  },
  title: {
    ...type.h1,
  },
});
