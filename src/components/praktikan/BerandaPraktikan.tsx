import React from 'react';
import { useTranslation } from 'react-i18next';
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
import { formatJam, titikJam } from '@/utils/format';
import { ScoreRingSvg } from './ScoreRingSvg';
import { TagihanRingkasCard } from './TagihanRingkasCard';
import { useJadwalPraktikan } from './useJadwalPraktikan';
import { useTagihanPraktikan } from './useTagihanPraktikan';

export function BerandaPraktikan() {
  const router = useRouter();
  const { currentUser, getStatusEfektif } = useSession();
  const { themeColors } = usePreferences();
  const { t } = useTranslation();
  const {
    daftarKelas,
    hadirMap,
    izinMap,
    sesiAktif,
    ringkasan,
    loading,
    error,
    retrySync,
  } = useJadwalPraktikan();
  const { jumlahAktif, totalTertunggak } = useTagihanPraktikan();

  if (!currentUser) return null;

  const sesiBerjalan = sesiAktif.find((s) => getStatusEfektif(s) === 'DIBUKA');
  const sudahHadirAktif = sesiBerjalan ? hadirMap.has(sesiBerjalan.id) : false;
  const izinAktifStatus = sesiBerjalan
    ? izinMap.get(sesiBerjalan.id)
    : undefined;
  const izinAktifDiterima = izinAktifStatus === 'DITERIMA';
  const tombolNonaktif = sudahHadirAktif || izinAktifDiterima;

  const jadwalMendatang = daftarKelas
    .filter((s) => getStatusEfektif(s) === 'TERJADWAL')
    .slice(0, 2);

  const waktuHadirText = (sesiId: string) => {
    const waktu = hadirMap.get(sesiId);
    return waktu ? titikJam(formatJam(waktu)) : undefined;
  };

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(praktikan)/sesi/[id]', params: { id } } as any);

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
            {t('beranda.welcomeBack')}
          </Text>
          <Text
            style={[styles.welcomeTitle, { color: themeColors.textPrimary }]}
          >
            {currentUser.nama.split(' ')[0]}!
          </Text>
          <Text
            style={[styles.welcomeSub, { color: themeColors.textSecondary }]}
          >
            {t('beranda.readyPrompt')}
          </Text>
        </View>

        {/* 2. Kartu Sesi Aktif */}
        {error ? (
          <View style={styles.emptyActiveWrap}>
            <EmptyState
              judul={t('beranda.loadError')}
              pesan={error}
              aksi={{
                label: t('common.retry'),
                onPress: retrySync,
              }}
            />
          </View>
        ) : loading ? (
          <View style={styles.emptyActiveWrap}>
            <EmptyState
              judul={t('beranda.loadingData')}
              pesan={t('common.pleaseWait')}
            />
          </View>
        ) : sesiBerjalan ? (
          <View style={styles.activeCard}>
            <View style={styles.activeGlowRing} />
            <View style={styles.activeCardHead}>
              <View style={styles.liveLabelRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveLabelText}>
                  {t('beranda.activeSession')}
                </Text>
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
              onPress={() => bukaDetail(sesiBerjalan.id)}
            >
              {sudahHadirAktif
                ? t('presensi.checkedIn')
                : izinAktifDiterima
                  ? t('presensi.excused')
                  : izinAktifStatus === 'MENUNGGU'
                    ? t('presensi.pendingLeave')
                    : t('presensi.checkIn')}
            </Tombol>
          </View>
        ) : (
          <View style={styles.emptyActiveWrap}>
            <EmptyState
              judul={t('beranda.noActiveSession')}
              pesan={t('beranda.noActiveSessionBody')}
            />
          </View>
        )}

        {/* 3. Kartu Ringkasan Tagihan */}
        {jumlahAktif > 0 ? (
          <TagihanRingkasCard
            jumlah={jumlahAktif}
            total={totalTertunggak}
            onPress={() => router.push('/(praktikan)/tagihan' as any)}
            style={styles.tagihanRingkas}
          />
        ) : null}

        {/* 4. Kartu Ringkasan Kehadiran */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryCopy}>
              <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
                {t('beranda.summaryKicker')}
              </Text>
              <Text
                style={[
                  styles.summaryTitle,
                  { color: themeColors.textPrimary },
                ]}
              >
                {t('beranda.summaryTitle')}
              </Text>
            </View>
            <ScoreRingSvg
              value={ringkasan.persen}
              label={t('beranda.presentUnit')}
            />
          </View>

          <View
            style={[
              styles.summaryStatsRow,
              { borderTopColor: themeColors.border },
            ]}
          >
            <View style={styles.statCol}>
              <Text
                style={[styles.statValue, { color: themeColors.textPrimary }]}
              >
                {ringkasan.hadir}
              </Text>
              <Text
                style={[styles.statLabel, { color: themeColors.textSecondary }]}
              >
                {t('beranda.statPresent')}
              </Text>
            </View>
            <View
              style={[
                styles.statCol,
                styles.statColBorder,
                { borderLeftColor: themeColors.border },
              ]}
            >
              <Text
                style={[styles.statValue, { color: themeColors.textPrimary }]}
              >
                {ringkasan.izin}
              </Text>
              <Text
                style={[styles.statLabel, { color: themeColors.textSecondary }]}
              >
                {t('beranda.statLeave')}
              </Text>
            </View>
            <View
              style={[
                styles.statCol,
                styles.statColBorder,
                { borderLeftColor: themeColors.border },
              ]}
            >
              <Text
                style={[styles.statValue, { color: themeColors.textPrimary }]}
              >
                {ringkasan.belumHadir}
              </Text>
              <Text
                style={[styles.statLabel, { color: themeColors.textSecondary }]}
              >
                {t('beranda.statAbsent')}
              </Text>
            </View>
            <View
              style={[
                styles.statCol,
                styles.statColBorder,
                { borderLeftColor: themeColors.border },
              ]}
            >
              <Text
                style={[styles.statValue, { color: themeColors.textPrimary }]}
              >
                {ringkasan.total}
              </Text>
              <Text
                style={[styles.statLabel, { color: themeColors.textSecondary }]}
              >
                {t('beranda.statTotal')}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Jadwal Mendatang */}
        <SectionHeading
          kicker={t('beranda.upcomingKicker')}
          title={t('beranda.upcomingTitle')}
          style={styles.sectionHeading}
        />

        {loading ? (
          <EmptyState
            judul={t('beranda.loadingSchedule')}
            pesan={t('common.pleaseWait')}
          />
        ) : jadwalMendatang.length === 0 ? (
          <EmptyState
            judul={t('beranda.noUpcoming')}
            pesan={t('beranda.noUpcomingBody')}
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
    borderColor: colors.graphiteSurface,
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
  tagihanRingkas: { marginTop: spacing.s5 },
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
