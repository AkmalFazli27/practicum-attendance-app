import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, DoorOpen, Plus, Users } from 'lucide-react-native';

import {
  EmptyState,
  MetricCard,
  SectionHeading,
  SessionCard,
  Tombol,
} from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { titikJam } from '@/utils/format';
import { SesiFormSheet } from './SesiFormSheet';

export function BerandaAsisten() {
  const router = useRouter();
  const { currentUser, sesi, getKehadiranSesi, getIzinSesi } = useSession();
  const [tambahVisible, setTambahVisible] = useState(false);

  const sesiSaya = useMemo(
    () =>
      sesi
        .filter((s) => s.asistenId === currentUser?.id)
        .sort((a, b) =>
          `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`),
        ),
    [sesi, currentUser?.id],
  );

  if (!currentUser) return null;

  const sesiAktif = sesiSaya.find((s) => s.status === 'DIBUKA');
  const jumlahAktif = sesiSaya.filter((s) => s.status === 'DIBUKA').length;
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
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Sapaan */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeKicker}>Panel asisten,</Text>
          <Text style={styles.welcomeTitle}>
            {currentUser.nama.split(' ')[0]}!
          </Text>
          <Text style={styles.welcomeSub}>
            Kelola sesi dan pantau kehadiran hari ini.
          </Text>
        </View>

        {/* 2. Metric Grid 2 Kolom */}
        <View style={styles.metricGrid}>
          <MetricCard
            dark
            icon={<DoorOpen size={20} color={colors.graphite} />}
            value={jumlahAktif}
            label="Sesi aktif"
          />
          <MetricCard
            icon={<Users size={20} color={colors.textPrimary} />}
            value={totalHadir}
            label="Total hadir"
          />
        </View>

        {/* 3. Kartu Sesi Berjalan */}
        {sesiAktif ? (
          <View style={styles.activeSessionCard}>
            <Text style={styles.kicker}>SEDANG BERLANGSUNG</Text>
            <View style={styles.activeMainRow}>
              <View style={styles.activeInfoLeft}>
                <Text style={styles.activeTitle} numberOfLines={1}>
                  {sesiAktif.namaPraktikum}
                </Text>
                <Text style={styles.activeSub}>
                  {titikJam(sesiAktif.jamMulai)}–{titikJam(sesiAktif.jamSelesai)} ·{' '}
                  {sesiAktif.lab}
                </Text>
              </View>
              <Text style={styles.bigCount}>
                {hadirSesiAktif}
                <Text style={styles.bigCountSub}>/{kapasitasAktif}</Text>
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${persenAktif}%` }]}
              />
            </View>

            <Tombol
              variant="primer"
              onPress={() => bukaDetail(sesiAktif.id)}
              rightIcon={<ArrowRight size={18} color={colors.onPrimary} />}
            >
              Kelola sesi
            </Tombol>
          </View>
        ) : (
          <View style={styles.noActiveWrapper}>
            <EmptyState
              judul="Tidak ada sesi aktif"
              pesan="Buka salah satu sesi terjadwal saat kegiatan praktikum dimulai."
            />
          </View>
        )}

        {/* 4. Daftar Sesi Kamu */}
        <SectionHeading
          kicker="HARI INI & MENDATANG"
          title="Sesi kamu"
          style={styles.sectionHeading}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tambah sesi praktikum baru"
              onPress={() => setTambahVisible(true)}
              style={({ pressed }) => [
                styles.addChip,
                pressed && styles.addChipPressed,
              ]}
            >
              <Plus size={15} color={colors.textPrimary} />
              <Text style={styles.addChipText}>Sesi Baru</Text>
            </Pressable>
          }
        />

        {sesiSaya.length === 0 ? (
          <EmptyState
            judul="Belum ada sesi"
            pesan="Tambahkan sesi praktikum baru untuk mulai mengelola kehadiran."
            aksi={{
              label: 'Tambah Sesi Baru',
              onPress: () => setTambahVisible(true),
            }}
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
                  session={item}
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
      </ScrollView>

      <SesiFormSheet
        visible={tambahVisible}
        onClose={() => setTambahVisible(false)}
      />
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
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.s3,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryPressed,
  },
  addChipPressed: {
    opacity: 0.8,
  },
  addChipText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  sessionList: {
    gap: spacing.s3,
  },
});

