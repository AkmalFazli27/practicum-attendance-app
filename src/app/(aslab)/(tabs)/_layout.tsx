import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarDays,
  Home,
  LayoutGrid,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import { AppHeader } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { colors, fontFamily, layout, type } from '@/theme/tokens';

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
          size={20}
          strokeWidth={2.2}
          color={focused ? themeColors.onPrimary : themeColors.textMuted}
        />
      </View>
      <Text
        numberOfLines={1}
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

export default function AslabTabs() {
  const insets = useSafeAreaInsets();
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
          },
          tabBarItemStyle: { justifyContent: 'center' },
          tabBarIconStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="beranda-aslab"
          options={{
            title: t('tab_home'),
            tabBarLabel: ({ focused }) => (
              <TabItem label={t('tab_home')} focused={focused} Icon={Home} />
            ),
          }}
        />
        <Tabs.Screen
          name="lab"
          options={{
            title: t('tab_lab'),
            tabBarLabel: ({ focused }) => (
              <TabItem
                label={t('tab_lab')}
                focused={focused}
                Icon={LayoutGrid}
              />
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
          name="denda"
          options={{
            title: t('tab_fines'),
            tabBarLabel: ({ focused }) => (
              <TabItem label={t('tab_fines')} focused={focused} Icon={Wallet} />
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
    width: 36,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...type.micro,
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
});
