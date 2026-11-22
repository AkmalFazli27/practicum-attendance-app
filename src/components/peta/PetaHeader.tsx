import React from 'react';
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

import { colors, layout, radius, spacing, type } from '@/theme/tokens';

export interface PetaHeaderProps {
  onRefresh?: () => void;
  sedangMemuat?: boolean;
  /** Default "Peta Laboratorium"; halaman lain memakai header yang sama. */
  judul?: string;
  kicker?: string;
}

export function PetaHeader({
  onRefresh,
  sedangMemuat = false,
  judul = 'Peta Laboratorium',
  kicker = 'PETA',
}: PetaHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          accessibilityLabel="Kembali"
          onPress={handleKembali}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.center}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{judul}</Text>
        </View>

        {onRefresh ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Muat ulang data laboratorium"
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
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <RefreshCw size={18} color={colors.textPrimary} />
            )}
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textMuted,
    letterSpacing: 1.1,
    textAlign: 'center',
    // `alignItems: 'center'` pada `center` tidak melebarkan anak, sehingga teks
    // bisa melebar melewati kotaknya dan menimpa tombol saat font diperbesar.
    width: '100%',
  },
  title: {
    ...type.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  iconBtnDisabled: {
    opacity: 0.55,
  },
  iconPlaceholder: {
    width: 42,
    height: 42,
  },
});
