import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarDays,
  History,
  Home,
  QrCode,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';

import { AppHeader } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { colors, fontFamily, layout, shadows, type } from '@/theme/tokens';

function TabItem({
  label,
  focused,
  Icon,
}: {
  label: string;
  focused: boolean;
  Icon: LucideIcon;
}) {
  const { themeColors } = usePreferences();
  return (
    <View style={styles.tabItem}>
      <View
        style={[
          styles.iconPill,
          focused && { backgroundColor: themeColors.primary },
        ]}
      >
        <Icon
          size={21}
          strokeWidth={2.2}
          color={focused ? themeColors.onPrimary : themeColors.textMuted}
        />
      </View>
      <Text
        style={[
          styles.label,
          focused
            ? { fontFamily: fontFamily.bold, color: themeColors.textPrimary }
            : { color: themeColors.textMuted },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function QrCenterTab({ label }: { label: string }) {
  const { themeColors } = usePreferences();
  return (
    <View style={styles.qrTabWrap}>
      <View
        style={[
          styles.qrCircle,
          {
            backgroundColor: themeColors.primary,
            borderColor: themeColors.surface,
          },
        ]}
      >
        <QrCode size={28} strokeWidth={2.3} color={themeColors.onPrimary} />
      </View>
      <Text
        style={[
          styles.label,
          {
            fontFamily: fontFamily.bold,
            color: themeColors.textPrimary,
            marginTop: 2,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function PraktikanTabs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeColors, t } = usePreferences();

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <AppHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: themeColors.surface,
            borderTopWidth: 1,
            borderTopColor: themeColors.border,
            height: layout.tabBarHeight + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 10),
            paddingTop: 8,
            overflow: 'visible',
          },
          tabBarItemStyle: { justifyContent: 'center', overflow: 'visible' },
          tabBarIconStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="beranda-praktikan"
          options={{
            title: t('tab_home'),
            tabBarLabel: ({ focused }) => (
              <TabItem label={t('tab_home')} focused={focused} Icon={Home} />
            ),
          }}
        />
        <Tabs.Screen
          name="jadwal"
          options={{
            title: t('tab_schedule'),
            tabBarLabel: ({ focused }) => (
              <TabItem
                label={t('tab_schedule')}
                focused={focused}
                Icon={CalendarDays}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="qr-tab"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.push('/scan-qr' as any);
            },
          }}
          options={{
            title: t('tab_qr'),
            tabBarLabel: () => <QrCenterTab label={t('tab_qr')} />,
          }}
        />
        <Tabs.Screen
          name="riwayat"
          options={{
            title: t('tab_history'),
            tabBarLabel: ({ focused }) => (
              <TabItem
                label={t('tab_history')}
                focused={focused}
                Icon={History}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: t('tab_profile'),
            tabBarLabel: ({ focused }) => (
              <TabItem
                label={t('tab_profile')}
                focused={focused}
                Icon={UserRound}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconPill: {
    width: 38,
    height: 31,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrTabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  qrCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.activeCard,
  },
  label: {
    ...type.micro,
    letterSpacing: 0.2,
  },
});
