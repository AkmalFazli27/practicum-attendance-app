import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { layout, spacing, type } from '@/theme/tokens';

// STUB P1 — isi final milik P2. Jangan ubah layout/tab.
export default function LabAslabScreen() {
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
            {isEn ? 'LAB MANAGEMENT' : 'MANAJEMEN LAB'}
          </Text>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            {isEn ? 'Manage labs' : 'Kelola Lab'}
          </Text>
        </View>

        <EmptyState
          judul={isEn ? 'Lab management coming soon' : 'Kelola Lab segera hadir'}
          pesan={
            isEn
              ? 'Lab CRUD, bulk insert, CSV review, and member transfer will be filled by P2.'
              : 'CRUD lab, bulk insert, review CSV, dan pindah anggota akan diisi P2.'
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
