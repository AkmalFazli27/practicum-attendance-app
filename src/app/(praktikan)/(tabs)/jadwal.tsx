import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState, FilterChip, SessionCard } from '@/components/ui';
import { useJadwalPraktikan } from '@/components/praktikan/useJadwalPraktikan';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { colors, layout, spacing, type } from '@/theme/tokens';
import { formatJam, titikJam } from '@/utils/format';
import { indeksAwalSelesai, izinDitampilkan } from '@/utils/urutanJadwal';

type Filter = 'SEMUA' | 'HADIR' | 'IZIN';

const FILTERS: Filter[] = ['SEMUA', 'HADIR', 'IZIN'];

export default function JadwalScreen() {
  const router = useRouter();
  const { currentUser } = useSession();
  const { themeColors } = usePreferences();
  const { t } = useTranslation();
  const { daftarKelas, hadirMap, izinMap, loading, error, retrySync } = useJadwalPraktikan();

  const [filter, setFilter] = useState<Filter>('SEMUA');

  const filterLabels: Record<Filter, string> = {
    SEMUA: t('jadwal.filterAll'),
    HADIR: t('jadwal.filterAttended'),
    IZIN: t('jadwal.filterLeave'),
  };

  const emptyCopy: Record<Filter, { judul: string; pesan: string }> = {
    SEMUA: {
      judul: t('jadwal.emptyAllTitle'),
      pesan: t('jadwal.emptyAllBody'),
    },
    HADIR: {
      judul: t('jadwal.emptyAttendedTitle'),
      pesan: t('jadwal.emptyAttendedBody'),
    },
    IZIN: {
      judul: t('jadwal.emptyLeaveTitle'),
      pesan: t('jadwal.emptyLeaveBody'),
    },
  };

  const data = useMemo(
    () =>
      daftarKelas.filter((s) => {
        if (filter === 'HADIR') return hadirMap.has(s.id);
        if (filter === 'IZIN') return izinDitampilkan(izinMap.get(s.id));
        return true;
      }),
    [daftarKelas, hadirMap, izinMap, filter],
  );

  // Pemisah hanya muncul bila daftar benar-benar memuat dua kelompok sekaligus.
  const indeksSelesai = indeksAwalSelesai(data);
  const tampilkanPemisah = indeksSelesai > 0;

  if (!currentUser) return null;

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(praktikan)/sesi/[id]', params: { id } } as any);

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageTitle}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {t('jadwal.kicker')}
          </Text>
          <Text style={[styles.h1, { color: themeColors.textPrimary }]}>
            {t('jadwal.title')}
          </Text>
          <Text style={[styles.sub, { color: themeColors.textSecondary }]}>
            {t('jadwal.subtitle')}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f}
              label={filterLabels[f]}
              aktif={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>

        {error ? (
          <EmptyState
            judul={t('jadwal.loadError')}
            pesan={error}
            aksi={{
              label: t('common.retry'),
              onPress: retrySync,
            }}
          />
        ) : loading ? (
          <EmptyState
            judul={t('jadwal.loadingTitle')}
            pesan={t('common.pleaseWait')}
          />
        ) : data.length === 0 ? (
          <EmptyState
            judul={emptyCopy[filter].judul}
            pesan={emptyCopy[filter].pesan}
            aksi={
              filter !== 'SEMUA'
                ? {
                    label: t('common.showAll'),
                    onPress: () => setFilter('SEMUA'),
                  }
                : undefined
            }
          />
        ) : (
          <View style={styles.list}>
            {data.map((s, index) => {
              const waktu = hadirMap.get(s.id);
              return (
                <React.Fragment key={s.id}>
                  {tampilkanPemisah && index === indeksSelesai && (
                    <View style={styles.separator}>
                      <Text style={[styles.separatorText, { color: themeColors.textMuted }]}>
                        {t('jadwal.completedSeparator')}
                      </Text>
                      <View style={[styles.separatorLine, { backgroundColor: themeColors.border }]} />
                    </View>
                  )}
                  <SessionCard
                    session={s}
                    attendedTime={waktu ? titikJam(formatJam(waktu)) : undefined}
                    izinStatus={izinMap.get(s.id)}
                    onPress={() => bukaDetail(s.id)}
                  />
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s5,
    paddingBottom: layout.tabContentBottomPadding,
    gap: spacing.s4 + 2,
  },
  pageTitle: { gap: 2 },
  kicker: { ...type.micro, color: colors.textMuted, letterSpacing: 1.15, marginBottom: 4 },
  h1: { ...type.h1, color: colors.textPrimary },
  sub: { ...type.caption, color: colors.textSecondary, marginTop: 5 },
  filterRow: { gap: spacing.s2 },
  list: { gap: spacing.s3 },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    marginTop: spacing.s2,
  },
  separatorText: {
    ...type.micro,
    letterSpacing: 1.15,
  },
  separatorLine: { flex: 1, height: 1 },
});
