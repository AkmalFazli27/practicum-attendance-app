import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react-native';

import { Brand, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';

export default function LandingScreen() {
  const router = useRouter();
  const { currentUser } = useSession();

  const handleMasuk = () => {
    if (currentUser) {
      router.replace(
        (currentUser.peran === 'asisten'
          ? '/beranda-asisten'
          : '/beranda-praktikan') as any,
      );
      return;
    }
    router.push('/login');
  };

  const handleDaftar = () => {
    router.push({ pathname: '/login', params: { mode: 'register' } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Brand compact onDark />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Masuk ke akun"
            onPress={handleMasuk}
            style={({ pressed }) => [
              styles.loginPill,
              pressed && styles.loginPillPressed,
            ]}
          >
            <Text style={styles.loginPillText}>
              {currentUser ? 'Beranda' : 'Masuk'}
            </Text>
            <ArrowRight size={15} color={colors.onGraphite} />
          </Pressable>
        </View>

        {/* Hero Section (Bersih tanpa demo/jadwal sebelum login) */}
        <View style={styles.hero}>
          <View style={styles. decorativeRing} />

          <View style={styles.eyebrow}>
            <Sparkles size={14} color={colors.primary} />
            <Text style={styles.eyebrowText}>
              PRESENSI PRAKTIKUM, DISEDERHANAKAN
            </Text>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.heroTitle}>Tap once.</Text>
            <Text style={[styles.heroTitle, styles.heroTitleAccent]}>
              You're in.
            </Text>
          </View>

          <Text style={styles.heroSubtitle}>
            Pantau jadwal praktikum, catat kehadiran secara real-time, dan
            kelola pengajuan izin berbantuan AI dalam satu aplikasi terpadu.
          </Text>

          {/* Highlight Pillars */}
          <View style={styles.pillarsContainer}>
            <View style={styles.pillarItem}>
              <View style={styles.pillarIcon}>
                <Zap size={18} color={colors.graphite} />
              </View>
              <View style={styles.pillarCopy}>
                <Text style={styles.pillarTitle}>Presensi Real-Time</Text>
                <Text style={styles.pillarDesc}>
                  Tersinkronisasi langsung antara praktikan dan asisten laboratorium.
                </Text>
              </View>
            </View>

            <View style={styles.pillarItem}>
              <View style={styles.pillarIcon}>
                <Sparkles size={18} color={colors.graphite} />
              </View>
              <View style={styles.pillarCopy}>
                <Text style={styles.pillarTitle}>Izin Berbantuan AI</Text>
                <Text style={styles.pillarDesc}>
                  Klasifikasi kategori alasan izin otomatis untuk membantu peninjauan asisten.
                </Text>
              </View>
            </View>

            <View style={styles.pillarItem}>
              <View style={styles.pillarIcon}>
                <ShieldCheck size={18} color={colors.graphite} />
              </View>
              <View style={styles.pillarCopy}>
                <Text style={styles.pillarTitle}>Akses Sesuai Peran</Text>
                <Text style={styles.pillarDesc}>
                  Ruang kerja khusus untuk Praktikan dan Asisten dengan keamanan akun.
                </Text>
              </View>
            </View>
          </View>

          {/* CTA Actions */}
          <View style={styles.ctaGroup}>
            <Tombol
              variant="primer"
              onPress={handleMasuk}
              rightIcon={<ArrowRight size={18} color={colors.onPrimary} />}
            >
              {currentUser ? 'Lanjut ke Beranda' : 'Mulai sekarang'}
            </Tombol>

            {!currentUser && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Daftar akun baru"
                onPress={handleDaftar}
                style={({ pressed }) => [
                  styles.secondaryDarkBtn,
                  pressed && styles.loginPillPressed,
                ]}
              >
                <CheckCircle2 size={17} color={colors.primary} />
                <Text style={styles.secondaryDarkBtnText}>
                  Belum punya akun? Daftar sekarang
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.graphite,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.graphite,
  },
  header: {
    height: layout.headerHeight,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loginPill: {
    minHeight: 40,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  loginPillPressed: {
    opacity: 0.8,
  },
  loginPillText: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.onGraphite,
  },
  hero: {
    flex: 1,
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s6,
    paddingBottom: spacing.s8,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeRing: {
    position: 'absolute',
    right: -120,
    top: 20,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(196, 241, 91, 0.14)',
  },
  eyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(196, 241, 91, 0.22)',
    backgroundColor: 'rgba(196, 241, 91, 0.08)',
  },
  eyebrowText: {
    ...type.micro,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  titleBlock: {
    marginTop: spacing.s5,
  },
  heroTitle: {
    ...type.display,
    color: colors.onGraphite,
  },
  heroTitleAccent: {
    color: colors.primary,
  },
  heroSubtitle: {
    ...type.body,
    color: colors.textOnDarkMuted,
    marginTop: spacing.s4,
    lineHeight: 22,
    maxWidth: 340,
  },
  pillarsContainer: {
    marginTop: spacing.s6,
    gap: spacing.s3,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    padding: spacing.s4,
    borderRadius: radius.card,
    backgroundColor: colors.graphiteSurface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillarIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarCopy: {
    flex: 1,
    gap: 2,
  },
  pillarTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.onGraphite,
  },
  pillarDesc: {
    ...type.caption,
    color: colors.textOnDarkMuted,
    lineHeight: 17,
  },
  ctaGroup: {
    marginTop: spacing.s8,
    gap: spacing.s3,
  },
  secondaryDarkBtn: {
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
    paddingHorizontal: spacing.s4,
  },
  secondaryDarkBtnText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.onGraphite,
  },
});
