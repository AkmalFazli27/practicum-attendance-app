import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={styles.labelWrap}>
      <View style={[styles.indicator, focused && styles.indicatorOn]} />
      <Text
        style={[
          styles.label,
          focused ? styles.labelOn : styles.labelOff,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function PraktikanTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
        },
        tabBarItemStyle: { justifyContent: 'center' },
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jadwal',
          tabBarLabel: ({ focused }) => <TabLabel label="Jadwal" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="riwayat"
        options={{
          title: 'Riwayat',
          tabBarLabel: ({ focused }) => <TabLabel label="Riwayat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarLabel: ({ focused }) => <TabLabel label="Profil" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  labelWrap: { alignItems: 'center', gap: spacing.s2 },
  indicator: {
    width: 24,
    height: 3,
    borderRadius: radius.badge,
    backgroundColor: 'transparent',
  },
  indicatorOn: { backgroundColor: colors.primary },
  label: { ...type.caption },
  labelOn: { color: colors.graphite, fontFamily: fontFamily.semibold },
  labelOff: { color: colors.textMuted },
});