import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, MapPin, Settings } from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, layout, spacing } from '@/theme/tokens';
import { inisialNama } from '@/utils/format';
import { Brand } from './Brand';

export interface AppHeaderProps {
  onMapPress?: () => void;
  onBellPress?: () => void;
  onAvatarPress?: () => void;
  onSettingsPress?: () => void;
}

export function AppHeader({
  onMapPress,
  onBellPress,
  onAvatarPress,
  onSettingsPress,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useSession();
  const { isDark, themeColors } = usePreferences();

  const isProfile = pathname?.includes('profil');

  const handleMap = () => {
    if (onMapPress) {
      onMapPress();
      return;
    }
    router.push('/peta' as any);
  };

  const handleBell = () => {
    if (onBellPress) {
      onBellPress();
      return;
    }
    router.push('/notifikasi' as any);
  };

  const handleAvatar = () => {
    if (onAvatarPress) {
      onAvatarPress();
      return;
    }
    if (!currentUser) return;
    const peran = currentUser.peran as 'praktikan' | 'asisten' | 'aslab';
    if (peran === 'aslab') {
      router.navigate('/(aslab)/(tabs)/beranda-aslab' as any);
      return;
    }
    router.navigate(
      (peran === 'asisten'
        ? '/(asisten)/(tabs)/profil'
        : '/(praktikan)/(tabs)/profil') as any,
    );
  };

  const handleSettings = () => {
    if (onSettingsPress) {
      onSettingsPress();
      return;
    }
    router.push('/pengaturan' as any);
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: themeColors.background,
          borderBottomColor: themeColors.border,
          paddingTop: insets.top,
          height: layout.headerHeight + insets.top,
        },
      ]}
    >
      <View style={styles.inner}>
        <Brand compact onDark={isDark} />

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka peta laboratorium"
            onPress={handleMap}
            style={({ pressed }) => [
              styles.iconButton,
              {
                borderColor: themeColors.border,
                backgroundColor: pressed
                  ? themeColors.surfaceMuted
                  : themeColors.surface,
              },
            ]}
          >
            <MapPin size={20} color={themeColors.textPrimary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifikasi"
            onPress={handleBell}
            style={({ pressed }) => [
              styles.iconButton,
              {
                borderColor: themeColors.border,
                backgroundColor: pressed
                  ? themeColors.surfaceMuted
                  : themeColors.surface,
              },
            ]}
          >
            <Bell size={20} color={themeColors.textPrimary} />
          </Pressable>

          {isProfile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buka pengaturan"
              onPress={handleSettings}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  borderColor: themeColors.textPrimary,
                  backgroundColor: pressed
                    ? themeColors.surfaceMuted
                    : themeColors.surface,
                },
              ]}
            >
              <Settings size={20} color={themeColors.textPrimary} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buka profil"
              onPress={handleAvatar}
              style={({ pressed }) => [
                styles.avatar,
                { backgroundColor: themeColors.graphite },
                pressed && styles.avatarPressed,
              ]}
            >
              <Text style={styles.avatarText}>
                {inisialNama(currentUser?.nama ?? 'User')}
              </Text>
            </Pressable>
          )}
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
  settingsButtonActive: {
    borderColor: colors.textPrimary,
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
    fontSize: 15,
    fontFamily: fontFamily.extrabold,
    color: colors.primary,
  },
});
