import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';

import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, layout, spacing } from '@/theme/tokens';
import { inisialNama } from '@/utils/format';
import { Brand } from './Brand';
import { useToast } from './Toast';

export interface AppHeaderProps {
  onBellPress?: () => void;
  onAvatarPress?: () => void;
}

export function AppHeader({ onBellPress, onAvatarPress }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useSession();
  const { showToast } = useToast();

  const handleBell = () => {
    if (onBellPress) {
      onBellPress();
      return;
    }
    showToast('Belum ada notifikasi baru.');
  };

  const handleAvatar = () => {
    if (onAvatarPress) {
      onAvatarPress();
      return;
    }
    if (!currentUser) return;
    router.navigate(
      (currentUser.peran === 'asisten'
        ? '/(asisten)/(tabs)/profil'
        : '/(praktikan)/(tabs)/profil') as any,
    );
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top,
          height: layout.headerHeight + insets.top,
        },
      ]}
    >
      <View style={styles.inner}>
        <Brand compact />

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifikasi"
            onPress={handleBell}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Bell size={20} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka profil"
            onPress={handleAvatar}
            style={({ pressed }) => [
              styles.avatar,
              pressed && styles.avatarPressed,
            ]}
          >
            <Text style={styles.avatarText}>
              {inisialNama(currentUser?.nama ?? 'User')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
  },
  inner: {
    height: layout.headerHeight,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2 + 1,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPressed: {
    opacity: 0.85,
  },
  avatarText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.extrabold,
    color: colors.primary,
  },
});

