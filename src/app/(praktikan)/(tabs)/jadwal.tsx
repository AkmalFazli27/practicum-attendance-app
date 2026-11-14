import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState, FilterChip, SessionCard } from '@/components/ui';
import { useJadwalPraktikan } from '@/components/praktikan/useJadwalPraktikan';
import { useSession } from '@/context/SessionContext';
import { colors, layout, spacing, type } from '@/theme/tokens';
import { formatJam, titikJam } from '@/utils/format';

type Filter = 'SEMUA' | 'DIBUKA' | 'HADIR' | 'IZIN';

const EMPTY_COPY: Record<Filter, { judul: string; pesan: string }> = {
  SEMUA: { judul: 'Belum ada jadwal', pesan: 'Jadwal praktikum akan tampil di sini.' },
  DIBUKA: { judul: 'Belum ada sesi', pesan: 'Tidak ada sesi yang sedang dibuka saat ini.' },
  HADIR: { judul: 'Belum ada sesi', pesan: 'Kamu belum menghadiri sesi apa pun.' },
  IZIN: { judul: 'Belum ada izin', pesan: 'Kamu belum mengajukan izin untuk sesi apa pun.' },
};

export default function JadwalScreen() {
  const router = useRouter();
  const { currentUser } = useSession();
  // TODO setelah kontrak Firebase di-merge Farras:
  // const { loading, error } = useSession();
  const { daftarKelas, hadirMap, izinMap } = useJadwalPraktikan();

  const [filter, setFilter] = useState<Filter>('SEMUA');

  const data = useMemo(
    () =>
      daftarKelas.filter((s) => {
        if (filter === 'DIBUKA') return s.status === 'DIBUKA';
        if (filter === 'HADIR') return hadirMap.has(s.id);
        if (filter === 'IZIN') return izinMap.has(s.id);
        return true;
      }),
    [daftarKelas, hadirMap, izinMap, filter],
  );

  if (!currentUser) return null;

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(praktikan)/sesi/[id]', params: { id } } as any);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'SEMUA', label: 'Semua' },
    { key: 'DIBUKA', label: 'Dibuka' },
    { key: 'HADIR', label: 'Dihadiri' },
    { key: 'IZIN', label: 'Izin' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageTitle}>
          <Text style={styles.kicker}>JADWAL</Text>
          <Text style={styles.h1}>Jadwal praktikum</Text>
          <Text style={styles.sub}>Temukan sesi dan status presensimu.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              aktif={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>

        {/* TODO setelah ada loading/error:
        {error ? (
          <EmptyState judul="Gagal memuat jadwal" pesan={error} />
        ) : loading ? (
          <EmptyState judul="Memuat jadwal…" pesan="Mohon tunggu sebentar." />
        ) : null} */}

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