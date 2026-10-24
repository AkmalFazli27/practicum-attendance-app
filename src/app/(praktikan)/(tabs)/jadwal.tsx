import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PresensiSheet } from '@/components/praktikan/PresensiSheet';
import { EmptyState, FilterChip, StatusBadge, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { formatJam, formatTanggal } from '@/utils/format';

type Filter = 'SEMUA' | 'DIBUKA' | 'HADIR';

const titik = (jam: string) => jam.replace(':', '.');
const jamHadir = (iso: string) => titik(formatJam(iso));

const EMPTY_COPY: Record<Filter, { judul: string; pesan: string }> = {
  SEMUA: { judul: 'Belum ada jadwal', pesan: 'Jadwal praktikum akan tampil di sini.' },
  DIBUKA: { judul: 'Tidak ada sesi', pesan: 'Tidak ada sesi yang dibuka.' },
  HADIR: { judul: 'Tidak ada sesi', pesan: 'Kamu belum menghadiri sesi apa pun.' },
};

export default function JadwalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, sesi, getKehadiranPraktikan } = useSession();

  const [filter, setFilter] = useState<Filter>('SEMUA');
  const [sesiPresensi, setSesiPresensi] = useState<Sesi | null>(null);

  // Sesi untuk kelas praktikan, urut tanggal lalu jam mulai.
  const daftarKelas = useMemo(
    () =>
      sesi
        .filter((s) => s.kelas === currentUser?.kelas)
        .sort((a, b) =>
          `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`),
        ),
    [sesi, currentUser?.kelas],
  );

  if (!currentUser) return null; // guard di _layout yang me-redirect

  // sesiId -> waktuHadir (ISO)
  const hadirMap = new Map(
    getKehadiranPraktikan(currentUser.id).map((k) => [k.sesiId, k.waktuHadir]),
  );

  const sesiAktif = daftarKelas.find((s) => s.status === 'DIBUKA');
  const waktuAktif = sesiAktif ? hadirMap.get(sesiAktif.id) : undefined;

  const data = daftarKelas.filter((s) => {
    if (filter === 'DIBUKA') return s.status === 'DIBUKA';
    if (filter === 'HADIR') return hadirMap.has(s.id);
    return true;
  });

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(praktikan)/sesi/[id]', params: { id } });

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.s4 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Sapaan */}
        <View>
          <Text style={styles.h1}>Halo, {currentUser.nama.split(' ')[0]}</Text>
          <Text style={styles.sub}>Praktikan · {currentUser.kelas}</Text>
        </View>

        {/* 2. Kartu sesi aktif */}
        <View style={styles.hero}>
          {sesiAktif ? (
            <>
              <Text style={styles.heroLabel}>Sesi dibuka sekarang</Text>
              <View style={styles.heroTitleBlock}>
                <Text style={styles.heroTitle}>{sesiAktif.namaPraktikum}</Text>
                <Text style={styles.heroMeta}>
                  {sesiAktif.lab} · {titik(sesiAktif.jamMulai)}–{titik(sesiAktif.jamSelesai)}
                </Text>
              </View>

              {waktuAktif ? (
                <View style={styles.heroBanner}>
                  <Text style={styles.heroBannerText}>
                    ✓ Presensi tercatat pukul {jamHadir(waktuAktif)}
                  </Text>
                </View>
              ) : (
                <Tombol variant="primer" onPress={() => setSesiPresensi(sesiAktif)}>
                  Presensi Sekarang
                </Tombol>
              )}
            </>
          ) : (
            <Text style={styles.heroKosong}>Tidak ada sesi yang dibuka saat ini.</Text>
          )}
        </View>

        {/* 3. Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <FilterChip label="Semua" aktif={filter === 'SEMUA'} onPress={() => setFilter('SEMUA')} />
          <FilterChip label="Dibuka" aktif={filter === 'DIBUKA'} onPress={() => setFilter('DIBUKA')} />
          <FilterChip label="Saya hadir" aktif={filter === 'HADIR'} onPress={() => setFilter('HADIR')} />
        </ScrollView>

        {/* 4. Daftar sesi */}
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
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.namaPraktikum}, status ${s.status}`}
                  onPress={() => bukaDetail(s.id)}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{s.namaPraktikum}</Text>
                    <StatusBadge status={s.status} />
                  </View>
                  <Text style={styles.cardMeta}>{s.kelas} · {s.lab}</Text>
                  <Text style={styles.cardMeta}>
                    {formatTanggal(s.tanggal)} · {titik(s.jamMulai)}–{titik(s.jamSelesai)}
                  </Text>
                  {waktu && (
                    <Text style={styles.cardHadir}>✓ Sudah presensi {jamHadir(waktu)}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <PresensiSheet sesi={sesiPresensi} onClose={() => setSesiPresensi(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.s5, paddingBottom: spacing.s8, gap: spacing.s6 },
  h1: { ...type.h1, color: colors.textPrimary },
  sub: { ...type.body, color: colors.textSecondary },

  hero: {
    backgroundColor: colors.graphite,
    borderRadius: radius.card,
    padding: spacing.s4,
    gap: spacing.s4,
  },
  heroLabel: { ...type.caption, color: colors.onGraphite, opacity: 0.7 },
  heroTitleBlock: { gap: spacing.s1 },
  heroTitle: { ...type.h2, color: colors.onGraphite },
  heroMeta: { ...type.body, color: colors.onGraphite, opacity: 0.7 },
  heroKosong: { ...type.body, color: colors.onGraphite },
  heroBanner: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.s4,
    borderRadius: radius.button,
    backgroundColor: colors.sesiDibukaBg,
  },
  heroBannerText: { ...type.bodyStrong, color: colors.sesiDibukaFg },

  filterRow: { gap: spacing.s2, paddingVertical: spacing.s1 },

  list: { gap: spacing.s3 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: spacing.s1,
  },
  cardPressed: { backgroundColor: colors.surfaceMuted },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.s2,
    marginBottom: spacing.s1,
  },
  cardTitle: { ...type.bodyStrong, color: colors.textPrimary, flex: 1 },
  cardMeta: { ...type.caption, color: colors.textSecondary },
  cardHadir: { ...type.caption, color: colors.sesiDibukaFg, marginTop: spacing.s1 },
});