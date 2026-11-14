import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, LogOut, ShieldCheck } from 'lucide-react-native';

import { Tombol, useToast } from '@/components/ui';
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
  const { currentUser, sesi, logout } = useSession();
  const { showToast } = useToast();

  if (!currentUser) return null;

  const handleLogout = async () => {
    const hasil = await logout();
    if (!hasil.ok) {
      showToast(hasil.alasan);
    }
  };

  const emailTampil =
    currentUser.email ??
    `${currentUser.nama.toLowerCase().replace(/\s+/g, '.')}@tapin.ac.id`;
  const jumlahSesiDikelola = sesi.filter(
    (s) => s.asistenId === currentUser.id,
  ).length;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {inisialNama(currentUser.nama)}
            </Text>
          </View>
          <Text style={styles.name}>{currentUser.nama}</Text>
          <Text style={styles.meta}>
            {currentUser.nim ?? 'Asisten Praktikum'} · Laboratorium
          </Text>
          <View style={styles.roleBadge}>
            <ShieldCheck size={15} color={colors.sesiDibukaFg} />
            <Text style={styles.roleBadgeText}>{currentUser.peran}</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {emailTampil}
            </Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Status akun</Text>
            <View style={styles.verifiedWrap}>
              <CheckCircle2 size={16} color={colors.sesiDibukaFg} />
              <Text style={styles.verifiedText}>Terverifikasi</Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Sesi dikelola</Text>
            <Text style={styles.rowValue}>{jumlahSesiDikelola} sesi</Text>
          </View>
        </View>

        <Tombol
          variant="danger"
          icon={<LogOut size={18} color={colors.errorFg} />}
          onPress={handleLogout}
        >
          Keluar dari akun
        </Tombol>

        <Text style={styles.version}>
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
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.s3,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  roleBadgeText: {
    ...type.micro,
    color: colors.sesiDibukaFg,
    textTransform: 'capitalize',
  },
  profileCard: {
    marginBottom: spacing.s4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s4,
  },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s3,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: {
    ...type.caption,
    color: colors.textMuted,
  },
  rowValue: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    maxWidth: '65%',
  },
  verifiedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifiedText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  version: {
    ...type.micro,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.s5,
  },
});
