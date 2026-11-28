import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, MapPin, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
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
  const unread = useUnreadNotificationCount(currentUser?.id);
  const { isDark, themeColors } = usePreferences();
  const { t } = useTranslation();

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
      router.navigate('/(aslab)/(tabs)/profil' as any);
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
            accessibilityLabel={t('common.openMapAria')}
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
            accessibilityLabel={t('notifikasi.unread', { count: unread })}
            onPress={handleBell}
            style={({ pressed }) => [
              styles.iconButton,
              styles.iconButtonRelative,
              {
                borderColor: themeColors.border,
                backgroundColor: pressed
                  ? themeColors.surfaceMuted
                  : themeColors.surface,
              },
            ]}
          >
            <Bell size={20} color={themeColors.textPrimary} />
            {unread > 0 ? (
              <View
                style={[
                  styles.notifBadge,
                  { backgroundColor: themeColors.errorFg },
                ]}
              >
                <Text
                  style={[
                    styles.notifBadgeText,
                    {
                      color: isDark
                        ? themeColors.onPrimary
                        : themeColors.onGraphite,
                    },
                  ]}
                >
                  {unread > 99 ? '99+' : String(unread)}
                </Text>
              </View>
            ) : null}
          </Pressable>

          {isProfile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.openSettingsAria')}
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
              accessibilityLabel={t('common.openProfileAria')}
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
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonRelative: {
    position: 'relative',
    overflow: 'visible',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    lineHeight: 12,
  },
  settingsButtonActive: {
    borderColor: colors.textPrimary,
  },
  iconButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  avatar: {
    width: 44,
    height: 44,
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
