import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState, FilterChip, SessionCard } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, layout, spacing, type } from '@/theme/tokens';
import { formatJam, titikJam } from '@/utils/format';

type Filter = 'SEMUA' | 'DIBUKA' | 'HADIR';

const EMPTY_COPY: Record<Filter, { judul: string; pesan: string }> = {
  SEMUA: {
    judul: 'Belum ada jadwal',
    pesan: 'Jadwal praktikum akan tampil di sini.',
  },
  DIBUKA: {
    judul: 'Belum ada sesi',
    pesan: 'Tidak ada sesi yang sedang dibuka saat ini.',
  },
  HADIR: {
    judul: 'Belum ada sesi',
    pesan: 'Kamu belum menghadiri sesi apa pun.',
  },
};

export default function JadwalScreen() {
  const router = useRouter();
  const {
    currentUser,
    sesi,
    getKehadiranPraktikan,
    getIzinPraktikan,
  } = useSession();

  const [filter, setFilter] = useState<Filter>('SEMUA');

  const daftarKelas = useMemo(
    () =>
      sesi
        .filter((s) => !currentUser?.kelas || s.kelas === currentUser.kelas)
        .sort((a, b) =>
          `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`),
        ),
    [sesi, currentUser?.kelas],
  );

  if (!currentUser) return null;

  const hadirMap = new Map(
    getKehadiranPraktikan(currentUser.id).map((k) => [
      k.sesiId,
      titikJam(formatJam(k.waktuHadir)),
    ]),
  );
  const izinMap = new Map(
    getIzinPraktikan(currentUser.id).map((iz) => [iz.sesiId, iz.status]),
  );

  const data = daftarKelas.filter((s) => {
    if (filter === 'DIBUKA') return s.status === 'DIBUKA';
    if (filter === 'HADIR') return hadirMap.has(s.id);
    return true;
  });

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(praktikan)/sesi/[id]', params: { id } } as any);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitle}>
          <Text style={styles.kicker}>SEMUA</Text>
          <Text style={styles.h1}>Jadwal praktikum</Text>
          <Text style={styles.sub}>Temukan sesi dan status presensimu.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <FilterChip
            label="Semua"
            aktif={filter === 'SEMUA'}
            onPress={() => setFilter('SEMUA')}
          />
          <FilterChip
            label="Dibuka"
            aktif={filter === 'DIBUKA'}
            onPress={() => setFilter('DIBUKA')}
          />
          <FilterChip
            label="Dihadiri"
            aktif={filter === 'HADIR'}
            onPress={() => setFilter('HADIR')}
          />
        </ScrollView>

        {data.length === 0 ? (
          <EmptyState
            judul={EMPTY_COPY[filter].judul}
            pesan={EMPTY_COPY[filter].pesan}
            aksi={
              filter !== 'SEMUA'
                ? { label: 'Tampilkan semua', onPress: () => setFilter('SEMUA') }
                : undefined
            }
          />
        ) : (
          <View style={styles.list}>
            {data.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                attendedTime={hadirMap.get(s.id)}
                izinStatus={izinMap.get(s.id)}
                onPress={() => bukaDetail(s.id)}
              />
            ))}
          </View>
        )}
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
    gap: spacing.s4 + 2,
  },
  pageTitle: {
    gap: 2,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.15,
    marginBottom: 4,
  },
  h1: {
    ...type.h1,
    color: colors.textPrimary,
  },
  sub: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 5,
  },
  filterRow: {
    gap: spacing.s2,
  },
  list: {
    gap: spacing.s3,
  },
});
