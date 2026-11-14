import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Info,
  LockKeyhole,
  MapPin,
  Users,
} from 'lucide-react-native';

import {
  Brand,
  EmptyState,
  SectionHeading,
  SessionCard,
  SheetModal,
  StatusBadge,
  Tombol,
} from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Peran, type Sesi } from '@/data/dummy';
import {
  colors,
  fontFamily,
  layout,
  radius,
  spacing,
  type,
} from '@/theme/tokens';
import { formatHariTanggalSingkat, titikJam } from '@/utils/format';

function berandaUntuk(peran: Peran): '/beranda-asisten' | '/beranda-praktikan' {
  return peran === 'asisten' ? '/beranda-asisten' : '/beranda-praktikan';
}

function SplashLayar() {
  return (
    <View style={styles.splash}>
      <StatusBar style="light" />
      <Brand large onDark />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.splashCaption}>Memeriksa sesi...</Text>
    </View>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, loading, sesi } = useSession();

  const [sesiIdDipilih, setSesiIdDipilih] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const sesiTampil = sesiIdDipilih
    ? (sesi.find((item) => item.id === sesiIdDipilih) ?? null)
    : null;

  const redirectAwalSelesai = useRef(false);

  useEffect(() => {
    if (loading || redirectAwalSelesai.current) return;
    redirectAwalSelesai.current = true;
    if (currentUser) {
      router.replace(berandaUntuk(currentUser.peran));
    }
  }, [loading, currentUser, router]);

  const punyaAksesDetail = (item: Sesi) => {
    if (!currentUser) return false;
    if (currentUser.peran === 'asisten') return item.asistenId === currentUser.id;
    return !currentUser.kelas || item.kelas === currentUser.kelas;
  };

  const aksesDetail = sesiTampil ? punyaAksesDetail(sesiTampil) : false;

  const jadwalTerdekat = useMemo(() => {
    const urut = (a: Sesi, b: Sesi) =>
      `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`);

    const belumSelesai = sesi
      .filter((item) => item.status !== 'SELESAI')
      .sort(urut);

    if (belumSelesai.length > 0) {
      return belumSelesai.slice(0, 3);
    }

    return [...sesi].sort(urut).slice(0, 3);
  }, [sesi]);

  if (loading) {
    return <SplashLayar />;
  }

  const handleMasuk = () => {
    if (currentUser) {
      router.replace(berandaUntuk(currentUser.peran));
      return;
    }
    router.push('/login');
  };

  const bukaDetail = (id: string) => {
    setSesiIdDipilih(id);
    setSheetVisible(true);
  };

  const tutupDetail = () => setSheetVisible(false);

  const handleLanjutDetail = () => {
    if (!sesiTampil) return;

    setSheetVisible(false);

    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!punyaAksesDetail(sesiTampil)) return;

    router.push({
      pathname:
        currentUser.peran === 'asisten'
          ? '/(asisten)/sesi/[id]'
          : '/(praktikan)/sesi/[id]',
      params: { id: sesiTampil.id },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroShell}>
          <View style={styles.header}>
            <Brand compact onDark />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={currentUser ? 'Buka beranda' : 'Masuk ke akun'}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

          <View style={styles.hero}>
            <View style={styles.decorativeRing} />

            <View style={styles.titleBlock}>
              <Text style={styles.heroTitle}>Tap once.</Text>
              <Text style={[styles.heroTitle, styles.heroTitleAccent]}>
                You're in.
              </Text>
            </View>

            <Text style={styles.heroSubtitle}>
              Pantau jadwal, catat kehadiran real-time, dan kelola izin berbantuan AI dalam satu aplikasi.
            </Text>

            <Tombol
              variant="primer"
              onPress={handleMasuk}
              rightIcon={<ArrowRight size={18} color={colors.onPrimary} />}
              style={styles.heroCta}
            >
              {currentUser ? 'Lanjut ke Beranda' : 'Mulai sekarang'}
            </Tombol>
          </View>
        </View>

        <View
          style={[
            styles.publicSchedule,
            { paddingBottom: Math.max(insets.bottom + spacing.s8, spacing.s8) },
          ]}
        >
          <SectionHeading
            kicker="JADWAL TERDEKAT"
            title="Sesi praktikum"
            right={
              <View style={styles.readOnlyBadge}>
                <LockKeyhole size={13} color={colors.textMuted} />
                <Text style={styles.readOnlyText}>Read-only</Text>
              </View>
            }
            style={styles.sectionHeading}
          />

          {jadwalTerdekat.length === 0 ? (
            <EmptyState
              judul="Belum ada jadwal"
              pesan="Jadwal praktikum akan tampil di sini."
            />
          ) : (
            <View style={styles.sessionList}>
              {jadwalTerdekat.map((item) => (
                <SessionCard
                  key={item.id}
                  session={item}
                  onPress={() => bukaDetail(item.id)}
                />
              ))}
            </View>
          )}

          {!currentUser && (
            <View style={styles.guestNote}>
              <Info size={17} color={colors.textMuted} />
              <Text style={styles.guestNoteText}>
                Masuk untuk melakukan presensi atau mengelola sesi.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <SheetModal
        visible={sheetVisible}
        kicker="DETAIL SESI"
        judul={sesiTampil?.namaPraktikum ?? ''}
        onClose={tutupDetail}
        footer={
          sesiTampil && (!currentUser || aksesDetail) ? (
            <Tombol
              variant="primer"
              onPress={handleLanjutDetail}
              rightIcon={<ArrowRight size={18} color={colors.onPrimary} />}
            >
              {currentUser ? 'Buka detail sesi' : 'Masuk untuk melanjutkan'}
            </Tombol>
          ) : undefined
        }
      >
        {sesiTampil && (
          <>
            <View style={styles.sheetStatusRow}>
              <StatusBadge status={sesiTampil.status} />
              {sesiTampil.topik && (
                <Text style={styles.sheetTopik} numberOfLines={2}>
                  {sesiTampil.topik}
                </Text>
              )}
            </View>

            <Text style={styles.sheetDeskripsi}>{sesiTampil.deskripsi}</Text>

            <View style={styles.detailGrid}>
              <View style={styles.gridCell}>
                <CalendarDays size={18} color={colors.textMuted} />
                <View style={styles.gridCopy}>
                  <Text style={styles.gridLabel}>Tanggal</Text>
                  <Text style={styles.gridValue}>
                    {formatHariTanggalSingkat(sesiTampil.tanggal)}
                  </Text>
                </View>
              </View>

              <View style={styles.gridCell}>
                <Clock3 size={18} color={colors.textMuted} />
                <View style={styles.gridCopy}>
                  <Text style={styles.gridLabel}>Waktu</Text>
                  <Text style={styles.gridValue}>
                    {titikJam(sesiTampil.jamMulai)}–{titikJam(sesiTampil.jamSelesai)}
                  </Text>
                </View>
              </View>

              <View style={styles.gridCell}>
                <MapPin size={18} color={colors.textMuted} />
                <View style={styles.gridCopy}>
                  <Text style={styles.gridLabel}>Lokasi</Text>
                  <Text style={styles.gridValue} numberOfLines={1}>
                    {sesiTampil.lab}
                  </Text>
                </View>
              </View>

              <View style={styles.gridCell}>
                <Users size={18} color={colors.textMuted} />
                <View style={styles.gridCopy}>
                  <Text style={styles.gridLabel}>Kelas</Text>
                  <Text style={styles.gridValue}>{sesiTampil.kelas}</Text>
                </View>
              </View>
            </View>

            {!currentUser && (
              <View style={styles.lockedBox}>
                <LockKeyhole size={16} color={colors.textMuted} />
                <Text style={styles.lockedText}>
                  Mode pengunjung hanya dapat melihat detail sesi.
                </Text>
              </View>
            )}

            {currentUser && !aksesDetail && (
              <View style={styles.lockedBox}>
                <LockKeyhole size={16} color={colors.textMuted} />
                <Text style={styles.lockedText}>
                  Sesi ini di luar kelas/area kamu. Kamu tetap dapat melihat detailnya di sini.
                </Text>
              </View>
            )}
          </>
        )}
      </SheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s4,
    backgroundColor: colors.graphite,
  },
  splashCaption: {
    ...type.caption,
    color: colors.textOnDarkMuted,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.graphite,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
  heroShell: {
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
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s6,
    paddingBottom: spacing.s8,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeRing: {
    position: 'absolute',
    right: -96,
    top: -8,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(196, 241, 91, 0.14)',
  },
  titleBlock: {
    marginTop: spacing.s2,
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
  heroCta: {
    marginTop: spacing.s6,
  },
  publicSchedule: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s6,
    backgroundColor: colors.background,
  },
  sectionHeading: {
    marginBottom: spacing.s4,
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.s2,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  readOnlyText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  sessionList: {
    gap: spacing.s3,
  },
  guestNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: spacing.s4,
    borderRadius: 13,
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s3 + 1,
    backgroundColor: colors.surfaceMuted,
  },
  guestNoteText: {
    ...type.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  sheetStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  sheetTopik: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  sheetDeskripsi: {
    ...type.caption,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s2 + 1,
  },
  gridCell: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s2 + 1,
    padding: spacing.s3,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  gridCopy: {
    flex: 1,
    gap: 3,
  },
  gridLabel: {
    ...type.micro,
    color: colors.textSecondary,
  },
  gridValue: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  lockedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 13,
    padding: spacing.s3,
    backgroundColor: colors.surfaceMuted,
  },
  lockedText: {
    ...type.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
