import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import {
  CheckCircle2,
  ChevronRight,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react-native';

import { useAslabStore } from '@/components/aslab/lab/aslabStore';
import { Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import {
  colors,
  fontFamily,
  layout,
  radius,
  shadows,
  spacing,
  type,
} from '@/theme/tokens';
import { inisialNama } from '@/utils/format';

export default function ProfilAsistenScreen() {
  const router = useRouter();
  const { currentUser, sesi, logout } = useSession();
  const { keanggotaanAll } = useAslabStore();
  const { showToast } = useToast();
  const { themeColors, language, t } = usePreferences();
  const isEn = language === 'en';
  const [sedangKeluar, setSedangKeluar] = useState(false);

  const jumlahKelasDikelola = useMemo(() => {
    if (!currentUser) return 0;
    const set = new Set<string>();
    for (const k of keanggotaanAll) {
      if (k.uid === currentUser.id && k.peran === 'asprak') {
        set.add(k.labId);
      }
    }
    if (set.size === 0) {
      for (const s of sesi) {
        if (s.asistenId === currentUser.id) {
          set.add(`${s.namaPraktikum.trim().toLowerCase()}_${s.kelas.trim().toLowerCase()}`);
        }
      }
    }
    return set.size;
  }, [currentUser, keanggotaanAll, sesi]);

  if (!currentUser) return <Redirect href="/" />;

  const emailTampil = currentUser.email?.trim() || '-';
  const nimTampil = currentUser.nim?.trim() || '-';
  const labelPeran =
    currentUser.peran === 'asisten' ? t('role_assistant') : t('role_student');

  const handleLogout = async () => {
    if (sedangKeluar) return;
    setSedangKeluar(true);
    try {
      const hasil = await logout();
      if (!hasil.ok) {
        showToast(hasil.alasan);
        return;
      }
      showToast(t('profile_logout_success'));
    } finally {
      setSedangKeluar(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.avatar,
              {
                borderColor: themeColors.surface,
                backgroundColor: themeColors.graphite,
              },
            ]}
          >
            <Text style={styles.avatarText}>
              {inisialNama(currentUser.nama)}
            </Text>
          </View>
          <Text style={[styles.name, { color: themeColors.textPrimary }]}>
            {currentUser.nama}
          </Text>
        </View>

        <View
          style={[
            styles.profileCard,
            {
              borderColor: themeColors.border,
              backgroundColor: themeColors.surface,
            },
          ]}
        >
          <View style={styles.row}>
            <Text
              style={[styles.rowLabel, { color: themeColors.textSecondary }]}
            >
              {t('profile_email')}
            </Text>
            <Text
              style={[styles.rowValue, { color: themeColors.textPrimary }]}
              numberOfLines={1}
            >
              {emailTampil}
            </Text>
          </View>

          <View
            style={[
              styles.row,
              styles.rowBorder,
              { borderTopColor: themeColors.border },
            ]}
          >
            <Text
              style={[styles.rowLabel, { color: themeColors.textSecondary }]}
            >
              NIM
            </Text>
            <Text
              style={[styles.rowValue, { color: themeColors.textPrimary }]}
              numberOfLines={1}
            >
              {nimTampil}
            </Text>
          </View>

          <View
            style={[
              styles.row,
              styles.rowBorder,
              { borderTopColor: themeColors.border },
            ]}
          >
            <Text
              style={[styles.rowLabel, { color: themeColors.textSecondary }]}
            >
              {t('profile_status')}
            </Text>
            <View style={styles.statusWrap}>
              <CheckCircle2 size={16} color={themeColors.sesiDibukaFg} />
              <Text
                style={[
                  styles.statusText,
                  { color: themeColors.sesiDibukaFg },
                ]}
              >
                {t('profile_active')}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.row,
              styles.rowBorder,
              { borderTopColor: themeColors.border },
            ]}
          >
            <Text
              style={[styles.rowLabel, { color: themeColors.textSecondary }]}
            >
              Role
            </Text>
            <View
              style={[
                styles.roleInlineBadge,
                { backgroundColor: themeColors.sesiDibukaBg },
              ]}
            >
              <ShieldCheck size={14} color={themeColors.sesiDibukaFg} />
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: themeColors.sesiDibukaFg },
                ]}
              >
                {labelPeran}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.row,
              styles.rowBorder,
              { borderTopColor: themeColors.border },
            ]}
          >
            <Text
              style={[styles.rowLabel, { color: themeColors.textSecondary }]}
            >
              {isEn ? 'Managed classes' : 'Kelas praktikum dikelola'}
            </Text>
            <Text style={[styles.rowValue, { color: themeColors.textPrimary }]}>
              {jumlahKelasDikelola} {isEn ? 'classes' : 'kelas'}
            </Text>
          </View>
        </View>

        {/* Akses Cepat ke Pengaturan & Preferensi (termasuk Perizinan Perangkat) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile_settings_title')}
          onPress={() => router.push('/pengaturan' as any)}
          style={({ pressed }) => [
            styles.menuCard,
            {
              borderColor: themeColors.border,
              backgroundColor: pressed
                ? themeColors.surfaceMuted
                : themeColors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.menuIconTile,
              { backgroundColor: themeColors.primarySoft },
            ]}
          >
            <Settings size={20} color={themeColors.textPrimary} />
          </View>
          <View style={styles.menuCopy}>
            <Text
              style={[styles.menuTitle, { color: themeColors.textPrimary }]}
            >
              {t('profile_settings_title')}
            </Text>
            <Text
              style={[styles.menuSub, { color: themeColors.textSecondary }]}
            >
              {t('profile_settings_sub')}
            </Text>
          </View>
          <ChevronRight size={18} color={themeColors.textMuted} />
        </Pressable>

        <Tombol
          variant="danger"
          icon={<LogOut size={18} color={themeColors.errorFg} />}
          onPress={handleLogout}
          loading={sedangKeluar}
        >
          {t('profile_logout')}
        </Tombol>

        <Text style={[styles.version, { color: themeColors.textMuted }]}>
          TapIn v1.0 · Tap once. You're in.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s5,
    paddingBottom: layout.tabContentBottomPadding,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.s5,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 27,
    borderWidth: 6,
    borderColor: colors.surface,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s4,
    ...shadows.card,
  },
  avatarText: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: fontFamily.extrabold,
    color: colors.primary,
  },
  name: {
    ...type.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  meta: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 6,
  },
  roleInlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  roleBadgeText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  profileCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s2,
    marginBottom: spacing.s4,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s4,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: {
    ...type.body,
    color: colors.textSecondary,
  },
  rowValue: {
    ...type.body,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    maxWidth: '65%',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    ...type.body,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.s4,
    ...shadows.card,
  },
  menuIconTile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCopy: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    ...type.body,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  menuSub: {
    ...type.micro,
    color: colors.textSecondary,
  },
  version: {
    ...type.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.s5,
  },
});
