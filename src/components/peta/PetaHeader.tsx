import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
import {
  layout,
  radius,
  spacing,
  type,
  type ThemeColors,
} from '@/theme/tokens';
import { teksPeta } from './teks';

export interface PetaHeaderProps {
  onRefresh?: () => void;
  sedangMemuat?: boolean;
  /** Default dari kamus teks P2; halaman lain memakai header yang sama. */
  judul?: string;
  kicker?: string;
}

export function PetaHeader({
  onRefresh,
  sedangMemuat = false,
  judul,
  kicker,
}: PetaHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeColors, language } = usePreferences();
  const teks = teksPeta(language);
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);
  const judulFinal = judul ?? teks.judulPeta;
  const kickerFinal = kicker ?? teks.kickerPeta;

  const handleKembali = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={teks.a11y.kembali}
          onPress={handleKembali}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
        >
          <ArrowLeft size={20} color={themeColors.textPrimary} />
        </Pressable>

        <View style={styles.center}>
          <Text style={styles.kicker}>{kickerFinal}</Text>
          <Text style={styles.title}>{judulFinal}</Text>
        </View>

        {onRefresh ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={teks.a11y.muatUlang}
            accessibilityState={{ busy: sedangMemuat }}
            disabled={sedangMemuat}
            onPress={onRefresh}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
              sedangMemuat && styles.iconBtnDisabled,
            ]}
          >
            {sedangMemuat ? (
              <ActivityIndicator size="small" color={themeColors.textPrimary} />
            ) : (
              <RefreshCw size={18} color={themeColors.textPrimary} />
            )}
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: w.background,
      borderBottomWidth: 1,
      borderBottomColor: w.border,
    },
    inner: {
      minHeight: 68,
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.s2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s3,
    },
    center: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: 2,
    },
    kicker: {
      ...type.micro,
      color: w.textMuted,
      letterSpacing: 1.1,
      textAlign: 'center',
      // `alignItems: 'center'` pada `center` tidak melebarkan anak, sehingga teks
      // bisa melebar melewati kotaknya dan menimpa tombol saat font diperbesar.
      width: '100%',
    },
    title: {
      ...type.h2,
      color: w.textPrimary,
      textAlign: 'center',
      width: '100%',
    },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnPressed: {
      backgroundColor: w.surfaceMuted,
    },
    iconBtnDisabled: {
      opacity: 0.55,
    },
    iconPlaceholder: {
      width: 42,
      height: 42,
    },
  });
