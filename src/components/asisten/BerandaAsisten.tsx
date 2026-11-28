import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, DoorOpen, Users } from 'lucide-react-native';

import {
  EmptyState,
  MetricCard,
  SectionHeading,
  SessionCard,
  Tombol,
} from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { titikJam } from '@/utils/format';
import { SinkronGuard } from './SyncState';
import { useSesiAsprak } from './useSesiAsprak';
import { useStatusSesi } from './useStatusSesi';

export function BerandaAsisten() {
  const router = useRouter();
  const { currentUser, getKehadiranSesi, getIzinSesi } = useSession();
  const { sesiSaya } = useSesiAsprak();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const { statusEfektif } = useStatusSesi();

  if (!currentUser) return null;

  const sesiAktif = sesiSaya.find((s) => statusEfektif(s) === 'DIBUKA');
  const jumlahAktif = sesiSaya.filter((s) => statusEfektif(s) === 'DIBUKA').length;
  const totalHadir = sesiSaya.reduce(
    (sum, item) => sum + getKehadiranSesi(item.id).length,
    0,
  );

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(asisten)/sesi/[id]', params: { id } } as any);

  const hadirSesiAktif = sesiAktif ? getKehadiranSesi(sesiAktif.id).length : 0;
  const kapasitasAktif = sesiAktif?.kapasitas ?? 32;
  const persenAktif = Math.min(
    100,
    Math.max(Math.round((hadirSesiAktif / kapasitasAktif) * 100), 12),
  );

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Sapaan */}
        <View style={styles.welcome}>
          <Text
            style={[styles.welcomeKicker, { color: themeColors.textSecondary }]}
          >
            {isEn ? 'Assistant panel,' : 'Panel asisten,'}
          </Text>
          <Text
            style={[styles.welcomeTitle, { color: themeColors.textPrimary }]}
          >
            {currentUser.nama.split(' ')[0]}!
          </Text>
          <Text
            style={[styles.welcomeSub, { color: themeColors.textSecondary }]}
          >
            {isEn
              ? "Manage sessions and monitor today's attendance."
              : 'Kelola sesi dan pantau kehadiran hari ini.'}
          </Text>
        </View>

        <SinkronGuard adaData={sesiSaya.length > 0}>
          {/* 2. Metric Grid 2 Kolom */}
          <View style={styles.metricGrid}>
            <MetricCard
              icon={<DoorOpen size={20} color={themeColors.textPrimary} />}
              value={jumlahAktif}
              label={isEn ? 'Active sessions' : 'Sesi aktif'}
            />
            <MetricCard
              icon={<Users size={20} color={themeColors.textPrimary} />}
              value={totalHadir}
              label={isEn ? 'Total attended' : 'Total hadir'}
            />
          </View>

          {/* 3. Kartu Sesi Berjalan */}
          {sesiAktif ? (
            <View
              style={[
                styles.activeSessionCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
                {isEn ? 'IN PROGRESS' : 'SEDANG BERLANGSUNG'}
              </Text>
              <View style={styles.activeMainRow}>
                <View style={styles.activeInfoLeft}>
                  <Text
                    style={[
                      styles.activeTitle,
                      { color: themeColors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {sesiAktif.namaPraktikum}
                  </Text>
                  <Text
                    style={[
                      styles.activeSub,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {titikJam(sesiAktif.jamMulai)}–{titikJam(sesiAktif.jamSelesai)} ·{' '}
                    {sesiAktif.lab}
                  </Text>
                </View>
                <Text
                  style={[styles.bigCount, { color: themeColors.textPrimary }]}
                >
                  {hadirSesiAktif}
                  <Text
                    style={[
                      styles.bigCountSub,
                      { color: themeColors.textMuted },
                    ]}
                  >
                    /{kapasitasAktif}
                  </Text>
                </Text>
              </View>

              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: themeColors.surfaceMuted },
                ]}
              >
                <View
                  style={[styles.progressFill, { width: `${persenAktif}%` }]}
                />
              </View>

              <Tombol
                variant="primer"
                onPress={() => bukaDetail(sesiAktif.id)}
                rightIcon={<ArrowRight size={18} color={themeColors.onPrimary} />}
              >
                {isEn ? 'Manage session' : 'Kelola sesi'}
              </Tombol>
            </View>
          ) : (
            <View style={styles.noActiveWrapper}>
              <EmptyState
                judul={isEn ? 'No active sessions' : 'Tidak ada sesi aktif'}
                pesan={
                  isEn
                    ? 'Open a scheduled session when the practicum starts.'
                    : 'Buka salah satu sesi terjadwal saat kegiatan praktikum dimulai.'
                }
              />
            </View>
          )}

          {/* 4. Daftar Sesi Kamu */}
          <SectionHeading
            kicker={isEn ? 'TODAY & UPCOMING' : 'HARI INI & MENDATANG'}
            title={isEn ? 'Your sessions' : 'Sesi kamu'}
            style={styles.sectionHeading}
          />

          {sesiSaya.length === 0 ? (
            <EmptyState
              judul={isEn ? 'No sessions yet' : 'Belum ada sesi'}
              pesan={
                isEn
                  ? 'Sessions scheduled by the lab assistant will appear here.'
                  : 'Sesi yang dijadwalkan oleh Aslab akan tampil di sini.'
              }
            />
          ) : (
            <View style={styles.sessionList}>
              {sesiSaya.slice(0, 3).map((item) => {
                const hadirCount = getKehadiranSesi(item.id).length;
                const pendingIzin = getIzinSesi(item.id).filter(
                  (iz) => iz.status === 'MENUNGGU',
                ).length;
                return (
                  <SessionCard
                    key={item.id}
                    session={{ ...item, status: statusEfektif(item) }}
                    assistant
                    attendance={hadirCount}
                    attendanceTotal={item.kapasitas ?? 32}
                    pendingIzinCount={pendingIzin}
                    onPress={() => bukaDetail(item.id)}
                  />
                );
              })}
            </View>
          )}
        </SinkronGuard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s5,
    paddingBottom: layout.tabContentBottomPadding,
  },
  welcome: {
    gap: 2,
  },
  welcomeKicker: {
    ...type.caption,
    color: colors.textSecondary,
  },
  welcomeTitle: {
    ...type.h1,
    color: colors.textPrimary,
    marginTop: 2,
  },
  welcomeSub: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 5,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.s3,
    marginTop: spacing.s5,
  },
  activeSessionCard: {
    marginTop: spacing.s4,
    padding: spacing.s4 + 2,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.1,
  },
  activeMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s3,
    marginTop: spacing.s3,
  },
  activeInfoLeft: {
    flex: 1,
    gap: 4,
  },
  activeTitle: {
    ...type.h3,
    color: colors.textPrimary,
  },
  activeSub: {
    ...type.caption,
    color: colors.textSecondary,
  },
  bigCount: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
  },
  bigCountSub: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    marginVertical: spacing.s4,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  noActiveWrapper: {
    marginTop: spacing.s4,
  },
  sectionHeading: {
    marginTop: spacing.s6 + 4,
    marginBottom: spacing.s3 + 2,
  },
  sessionList: {
    gap: spacing.s3,
  },
});