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
}

export function PetaHeader({
  onRefresh,
  sedangMemuat = false,
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
          <Text style={styles.kicker}>PETA</Text>
          <Text style={styles.title} numberOfLines={1}>
            Peta Laboratorium
          </Text>
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
    alignItems: 'center',
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.1,
  },
  title: {
    ...type.h2,
    color: colors.textPrimary,
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
