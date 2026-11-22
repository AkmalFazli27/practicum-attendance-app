import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState, FilterChip, SessionCard } from '@/components/ui';
import { useJadwalPraktikan } from '@/components/praktikan/useJadwalPraktikan';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { colors, layout, spacing, type } from '@/theme/tokens';
import { formatJam, titikJam } from '@/utils/format';

type Filter = 'SEMUA' | 'DIBUKA' | 'HADIR' | 'IZIN';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'SEMUA', label: 'Semua' },
  { key: 'DIBUKA', label: 'Dibuka' },
  { key: 'HADIR', label: 'Dihadiri' },
  { key: 'IZIN', label: 'Izin' },
];

const EMPTY_COPY: Record<Filter, { judul: string; pesan: string }> = {
  SEMUA: { judul: 'Belum ada jadwal', pesan: 'Jadwal praktikum akan tampil di sini.' },
  DIBUKA: { judul: 'Belum ada sesi', pesan: 'Tidak ada sesi yang sedang dibuka saat ini.' },
  HADIR: { judul: 'Belum ada sesi', pesan: 'Kamu belum menghadiri sesi apa pun.' },
  IZIN: { judul: 'Belum ada izin', pesan: 'Kamu belum mengajukan izin untuk sesi apa pun.' },
};

export default function JadwalScreen() {
  const router = useRouter();
  const { currentUser, getStatusEfektif } = useSession();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const { daftarKelas, hadirMap, izinMap, loading, error, retrySync } = useJadwalPraktikan();

  const [filter, setFilter] = useState<Filter>('SEMUA');

  const filterLabels: Record<Filter, string> = isEn
    ? { SEMUA: 'All', DIBUKA: 'Open', HADIR: 'Attended', IZIN: 'Leave' }
    : { SEMUA: 'Semua', DIBUKA: 'Dibuka', HADIR: 'Dihadiri', IZIN: 'Izin' };

  const emptyCopy: Record<Filter, { judul: string; pesan: string }> = isEn
    ? {
        SEMUA: { judul: 'No schedule yet', pesan: 'Practicum schedules will appear here.' },
        DIBUKA: { judul: 'No open sessions', pesan: 'No sessions are currently open.' },
        HADIR: { judul: 'No attended sessions', pesan: 'You have not attended any sessions yet.' },
        IZIN: { judul: 'No leave requests', pesan: 'You have not submitted any leave requests yet.' },
      }
    : EMPTY_COPY;

  const data = useMemo(
    () =>
      daftarKelas.filter((s) => {
        if (filter === 'DIBUKA') return getStatusEfektif(s) === 'DIBUKA';
        if (filter === 'HADIR') return hadirMap.has(s.id);
        if (filter === 'IZIN') return izinMap.has(s.id);
        return true;
      }),
    [daftarKelas, hadirMap, izinMap, filter, getStatusEfektif],
  );

  if (!currentUser) return null;

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(praktikan)/sesi/[id]', params: { id } } as any);

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageTitle}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {isEn ? 'SCHEDULE' : 'JADWAL'}
          </Text>
          <Text style={[styles.h1, { color: themeColors.textPrimary }]}>
            {isEn ? 'Practicum schedule' : 'Jadwal praktikum'}
          </Text>
          <Text style={[styles.sub, { color: themeColors.textSecondary }]}>
            {isEn
              ? 'Find your sessions and attendance status.'
              : 'Temukan sesi dan status presensimu.'}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={filterLabels[f.key]}
              aktif={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>

        {error ? (
          <EmptyState
            judul={isEn ? 'Failed to load schedule' : 'Gagal memuat jadwal'}
            pesan={error}
            aksi={{
              label: isEn ? 'Try again' : 'Coba lagi',
              onPress: retrySync,
            }}
          />
        ) : loading ? (
          <EmptyState
            judul={isEn ? 'Loading schedule…' : 'Memuat jadwal…'}
            pesan={isEn ? 'Please wait a moment.' : 'Mohon tunggu sebentar.'}
          />
        ) : data.length === 0 ? (
          <EmptyState
            judul={emptyCopy[filter].judul}
            pesan={emptyCopy[filter].pesan}
            aksi={
              filter !== 'SEMUA'
                ? {
                    label: isEn ? 'Show all' : 'Tampilkan semua',
                    onPress: () => setFilter('SEMUA'),
                  }
                : undefined
            }
          />
        ) : (
          <View style={styles.list}>
            {data.map((s) => {
              const waktu = hadirMap.get(s.id);
              return (
                <SessionCard
                  key={s.id}
                  session={s}
                  attendedTime={waktu ? titikJam(formatJam(waktu)) : undefined}
                  izinStatus={izinMap.get(s.id)}
                  onPress={() => bukaDetail(s.id)}
                />
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
});