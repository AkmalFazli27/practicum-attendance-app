import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  MoreHorizontal,
} from 'lucide-react-native';

import {
  EmptyState,
  SectionHeading,
  SessionCard,
  Tombol,
} from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import {
  colors,
  fontFamily,
  layout,
  radius,
  shadows,
  spacing,
  type,
} from '@/theme/tokens';
import { formatJam, titikJam } from '@/utils/format';
import { PresensiSheet } from './PresensiSheet';
import { ScoreRingSvg } from './ScoreRingSvg';
import { useJadwalPraktikan } from './useJadwalPraktikan';

export function BerandaPraktikan() {
  const router = useRouter();
  const { currentUser } = useSession();
  const { daftarKelas, hadirMap, izinMap, sesiAktif, ringkasan, loading } =
    useJadwalPraktikan();

  const [sesiPresensi, setSesiPresensi] = useState<Sesi | null>(null);

  if (!currentUser) return null;

  const sesiBerjalan = sesiAktif[0];
  const sudahHadirAktif = sesiBerjalan ? hadirMap.has(sesiBerjalan.id) : false;
  const sudahIzinAktif = sesiBerjalan ? izinMap.has(sesiBerjalan.id) : false;
  const tombolNonaktif = sudahHadirAktif || sudahIzinAktif;

  const jadwalMendatang = daftarKelas
    .filter((s) => s.status === 'TERJADWAL')
    .slice(0, 2);

  const waktuHadirText = (sesiId: string) => {
    const waktu = hadirMap.get(sesiId);
    return waktu ? titikJam(formatJam(waktu)) : undefined;
  };

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(praktikan)/sesi/[id]', params: { id } } as any);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Sapaan */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeKicker}>Selamat datang,</Text>
          <Text style={styles.welcomeTitle}>
            {currentUser.nama.split(' ')[0]}!
          </Text>
          <Text style={styles.welcomeSub}>Siap untuk praktikum hari ini?</Text>
        </View>

        {/* 2. Kartu Sesi Aktif */}
        {loading ? (
          <View style={styles.emptyActiveWrap}>
            <EmptyState judul="Memuat data…" pesan="Mohon tunggu sebentar." />
          </View>
        ) : sesiBerjalan ? (
          <View style={styles.activeCard}>
            <View style={styles.activeGlowRing} />
            <View style={styles.activeCardHead}>
              <View style={styles.liveLabelRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveLabelText}>SESI AKTIF</Text>
              </View>
              <MoreHorizontal size={20} color={colors.textOnDarkMuted} />
            </View>

            <Text style={styles.activeTitle}>{sesiBerjalan.namaPraktikum}</Text>
            <Text style={styles.activeTopic}>
              {sesiBerjalan.topik || sesiBerjalan.deskripsi}
            </Text>

            <View style={styles.activeInfoRow}>
              <View style={styles.activeInfoItem}>
                <Clock3 size={16} color={colors.primary} />
                <Text style={styles.activeInfoText}>
                  {titikJam(sesiBerjalan.jamMulai)}–
                  {titikJam(sesiBerjalan.jamSelesai)}
                </Text>
              </View>
              <View style={styles.activeInfoItem}>
                <MapPin size={16} color={colors.primary} />
                <Text style={styles.activeInfoText} numberOfLines={1}>
                  {sesiBerjalan.lab}
                </Text>
              </View>
            </View>

            <Tombol
              variant="primer"
              disabled={tombolNonaktif}
              icon={
                tombolNonaktif ? (
                  <CheckCircle2 size={18} color={colors.disabledText} />
                ) : undefined
              }
              rightIcon={
                !tombolNonaktif ? (
                  <ArrowRight size={18} color={colors.onPrimary} />
                ) : undefined
              }
              onPress={() => setSesiPresensi(sesiBerjalan)}
            >
              {sudahHadirAktif
                ? 'Sudah presensi'
                : sudahIzinAktif
                  ? 'Sudah mengajukan izin'
                  : 'Tap untuk presensi'}
            </Tombol>
          </View>
        ) : (
          <View style={styles.emptyActiveWrap}>
            <EmptyState
              judul="Tidak ada sesi aktif"
              pesan="Sesi aktif akan muncul di sini saat asisten membukanya."
            />
          </View>
        )}

        {/* 3. Kartu Ringkasan Kehadiran */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryCopy}>
              <Text style={styles.kicker}>RINGKASANMU</Text>
              <Text style={styles.summaryTitle}>Kehadiran semester ini</Text>
            </View>
            <ScoreRingSvg value={ringkasan.persen} label="hadir" />
          </View>

          <View style={styles.summaryStatsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{ringkasan.hadir}</Text>
              <Text style={styles.statLabel}>Hadir</Text>
            </View>
            <View style={[styles.statCol, styles.statColBorder]}>
              <Text style={styles.statValue}>{ringkasan.izin}</Text>
              <Text style={styles.statLabel}>Izin</Text>
            </View>
            <View style={[styles.statCol, styles.statColBorder]}>
              <Text style={styles.statValue}>{ringkasan.belumHadir}</Text>
              <Text style={styles.statLabel}>Belum hadir</Text>
            </View>
            <View style={[styles.statCol, styles.statColBorder]}>
              <Text style={styles.statValue}>{ringkasan.total}</Text>
              <Text style={styles.statLabel}>Total sesi</Text>
            </View>
          </View>
        </View>

        {/* 4. Jadwal Mendatang */}
        <SectionHeading
          kicker="BERIKUTNYA"
          title="Jadwal mendatang"
          style={styles.sectionHeading}
        />

        {loading ? (
          <EmptyState judul="Memuat jadwal…" pesan="Mohon tunggu sebentar." />
        ) : jadwalMendatang.length === 0 ? (
          <EmptyState
            judul="Tidak ada jadwal mendatang"
            pesan="Seluruh jadwal praktikum minggu ini telah selesai atau sedang dibuka."
          />
        ) : (
          <View style={styles.sessionList}>
            {jadwalMendatang.map((item) => (
              <SessionCard
                key={item.id}
                session={item}
                attendedTime={waktuHadirText(item.id)}
                izinStatus={izinMap.get(item.id)}
                onPress={() => bukaDetail(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <PresensiSheet
        sesi={sesiPresensi}
        onClose={() => setSesiPresensi(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s5,
    paddingBottom: layout.tabContentBottomPadding,
  },
  welcome: { gap: 2 },
  welcomeKicker: { ...type.caption, color: colors.textSecondary },
  welcomeTitle: { ...type.h1, color: colors.textPrimary, marginTop: 2 },
  welcomeSub: { ...type.caption, color: colors.textSecondary, marginTop: 5 },
  activeCard: {
    marginTop: spacing.s5,
    borderRadius: 22,
    padding: spacing.s5,
    backgroundColor: colors.graphite,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.activeCard,
  },
  activeGlowRing: {
    position: 'absolute',
    right: -75,
    top: -75,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(196, 241, 91, 0.2)',
  },
  activeCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  liveLabelText: { ...type.micro, color: colors.primary, letterSpacing: 1 },
  activeTitle: {
    ...type.h2,
    color: colors.onGraphite,
    marginTop: spacing.s4 + 2,
  },
  activeTopic: { ...type.caption, color: colors.textOnDarkMuted, marginTop: 5 },
  activeInfoRow: {
    flexDirection: 'row',
    gap: spacing.s4,
    marginTop: spacing.s4 + 2,
    marginBottom: spacing.s4,
  },
  activeInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  activeInfoText: { ...type.caption, color: colors.textOnDarkMuted, flex: 1 },
  emptyActiveWrap: { marginTop: spacing.s5 },
  summaryCard: {
    marginTop: spacing.s4,
    padding: spacing.s4 + 2,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.s4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s4,
  },
  summaryCopy: { flex: 1, gap: 4 },
  kicker: { ...type.micro, color: colors.textMuted, letterSpacing: 1.1 },
  summaryTitle: { ...type.h3, color: colors.textPrimary },
  summaryStatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s3 + 2,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 2 },
  statColBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statValue: {
    fontSize: 17,
    lineHeight: 21,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
  },
  statLabel: { ...type.micro, color: colors.textMuted },
  sectionHeading: {
    marginTop: spacing.s6 + 4,
    marginBottom: spacing.s3 + 2,
  },
  sessionList: { gap: spacing.s3 },
});