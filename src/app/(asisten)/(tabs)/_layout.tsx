import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarChart3,
  Home,
  LayoutGrid,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';

import { AppHeader } from '@/components/ui';
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
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Icon
          size={21}
          strokeWidth={2.2}
          color={focused ? colors.textPrimary : colors.textMuted}
        />
      </View>
      <Text style={[styles.label, focused ? styles.labelOn : styles.labelOff]}>
        {label}
      </Text>
    </View>
  );
}

export default function AsistenTabs() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <AppHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: layout.tabBarHeight + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 10),
            paddingTop: 8,
          },
          tabBarItemStyle: { justifyContent: 'center' },
          tabBarIconStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="beranda-asisten"
          options={{
            title: 'Beranda',
            tabBarLabel: ({ focused }) => (
              <TabItem label="Beranda" focused={focused} Icon={Home} />
            ),
          }}
        />
        <Tabs.Screen
          name="sesi"
          options={{
            title: 'Sesi',
            tabBarLabel: ({ focused }) => (
              <TabItem label="Sesi" focused={focused} Icon={LayoutGrid} />
            ),
          }}
        />
        <Tabs.Screen
          name="rekap"
          options={{
            title: 'Rekap',
            tabBarLabel: ({ focused }) => (
              <TabItem label="Rekap" focused={focused} Icon={BarChart3} />
            ),
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: 'Profil',
            tabBarLabel: ({ focused }) => (
              <TabItem label="Profil" focused={focused} Icon={UserRound} />
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
  iconPillActive: {
    backgroundColor: colors.primary,
  },
  label: {
    ...type.micro,
    letterSpacing: 0.2,
  },
  labelOn: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  },
  labelOff: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
  },
});
