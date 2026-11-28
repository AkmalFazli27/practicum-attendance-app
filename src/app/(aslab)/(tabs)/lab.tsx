import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarClock,
  Layers,
  MapPin,
} from 'lucide-react-native';

import { useAslabStore } from '@/components/aslab/lab/aslabStore';
import { Tombol } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import {
  fontFamily,
  layout,
  radius,
  spacing,
  type as tipe,
  type ThemeColors,
} from '@/theme/tokens';

/**
 * Tab Lab Aslab: 4 Kotak Fitur Minimalis & Clean (tanpa deskripsi panjang).
 */
export default function LabAslabScreen() {
  const router = useRouter();
  const { themeColors: tc, language } = usePreferences();
  const isEn = language === 'en';
  const tx = (id: string, en: string) => (isEn ? en : id);

  const { currentUser } = useSession();
  const { ruanganLabs, mataKuliahList, kelasList, sesiAll } = useAslabStore();
  const styles = useMemo(() => buatGaya(tc), [tc]);

  if (currentUser && currentUser.peran !== 'aslab') {
    return <Redirect href="/" />;
  }

  const fiturUtama = [
    {
      key: 'kelola-ruang',
      judul: tx('Kelola Lab', 'Lab Rooms'),
      meta: `${ruanganLabs.length} ${tx('ruang', 'rooms')}`,
      Icon: Building2,
      aksenBg: tc.primary,
      aksenFg: tc.onPrimary,
      href: '/(aslab)/lab/kelola-ruang',
    },
    {
      key: 'kelola-matkul',
      judul: tx('Mata Kuliah', 'Courses'),
      meta: `${mataKuliahList.length} ${tx('matkul', 'courses')}`,
      Icon: BookOpen,
      aksenBg: tc.sesiDibukaBg,
      aksenFg: tc.sesiDibukaFg,
      href: '/(aslab)/lab/kelola-matkul',
    },
    {
      key: 'kelola-kelas',
      judul: tx('Kelola Kelas', 'Classes'),
      meta: `${kelasList.length} ${tx('kelas', 'classes')}`,
      Icon: Layers,
      aksenBg: tc.pembayaranPendingBg,
      aksenFg: tc.pembayaranPendingFg,
      href: '/(aslab)/lab/kelola-kelas',
    },
    {
      key: 'kelola-sesi',
      judul: tx('Kelola Sesi', 'Sessions'),
      meta: `${sesiAll.length} ${tx('sesi', 'sessions')}`,
      Icon: CalendarClock,
      aksenBg: tc.gpsOffBg,
      aksenFg: tc.gpsOffFg,
      href: '/(aslab)/lab/kelola-sesi',
    },
  ] as const;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {tx('Manajemen Praktikum', 'Practicum Management')}
        </Text>

        {/* 4 Kotak Minimalis Clean (2x2) */}
        <View style={styles.gridWrap}>
          {fiturUtama.map((item) => {
            const IconComp = item.Icon;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => router.push(item.href as any)}
                style={({ pressed }) => [
                  styles.featureBox,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.boxTop}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: item.aksenBg },
                    ]}
                  >
                    <IconComp size={22} color={item.aksenFg} />
                  </View>
                  <Text style={styles.metaBadge}>{item.meta}</Text>
                </View>

                <View style={styles.boxBottom}>
                  <Text style={styles.boxTitle}>{item.judul}</Text>
                  <View style={styles.arrowPill}>
                    <ArrowRight size={15} color={tc.textPrimary} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Tombol
          variant="sekunder"
          icon={<MapPin size={16} color={tc.textPrimary} />}
          onPress={() => router.push('/peta' as any)}
        >
          {tx('Peta Lokasi Lab', 'Lab Map')}
        </Tombol>
      </ScrollView>
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: w.background,
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.s5,
      paddingBottom: layout.tabContentBottomPadding,
      gap: spacing.s4,
    },
    title: {
      ...tipe.h1,
      fontSize: 26,
      color: w.textPrimary,
    },
    gridWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    featureBox: {
      width: '47%',
      flexGrow: 1,
      height: 152,
      backgroundColor: w.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: w.border,
      padding: 18,
      justifyContent: 'space-between',
    },
    boxTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    iconCircle: {
      width: 46,
      height: 46,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metaBadge: {
      fontSize: 11.5,
      fontFamily: fontFamily.semibold,
      color: w.textMuted,
    },
    boxBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    boxTitle: {
      fontSize: 16,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
      flex: 1,
    },
    arrowPill: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: w.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.82,
    },
  });
