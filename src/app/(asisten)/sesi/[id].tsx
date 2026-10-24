import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { titik } from '@/components/asisten/helpers';
import { useAksiSesi } from '@/components/asisten/useAksiSesi';
import { EmptyState, StatusBadge, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { formatJam, formatTanggal } from '@/utils/format';

// Detail sesi asisten (FR-04)
export default function DetailSesiAsisten() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, users, getSesiById, getKehadiranSesi } = useSession();
  const { mulai, sheet } = useAksiSesi(() => router.back());

  const s = getSesiById(id);

  const navBar = (badge?: React.ReactNode) => (
    <View style={[styles.navBar, { paddingTop: insets.top + spacing.s2 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
      >
        <Text style={styles.navButtonIcon}>‹</Text>
        <Text style={styles.navButtonText}>Kembali</Text>
      </Pressable>
      {badge}
    </View>
  );

  // Sesi tidak ada, atau bukan milik asisten yang login.
  if (!currentUser || !s || s.asistenId !== currentUser.id) {
    return (
      <View style={styles.root}>
        {navBar()}
        <View style={styles.contentKosong}>
          <EmptyState
            judul="Sesi tidak ditemukan"
            pesan="Sesi ini tidak tersedia untuk akunmu."
          />
        </View>
        {sheet}
      </View>
    );
  }

  const daftarHadir = getKehadiranSesi(s.id)
    .slice()
    .sort((a, b) => a.waktuHadir.localeCompare(b.waktuHadir));

  const namaPraktikan = (praktikanId: string) =>
    users.find((u) => u.id === praktikanId)?.nama ?? 'Praktikan';

  const bukaRekap = () =>
    router.navigate({
      pathname: '/(asisten)/(tabs)/rekap',
      params: { sesiId: s.id, t: String(Date.now()) },
    } as any);

  return (
    <View style={styles.root}>
      {navBar(<StatusBadge status={s.status} />)}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info sesi */}
        <View style={styles.kotak}>
          <Text style={styles.h1}>{s.namaPraktikum}</Text>
          <Text style={styles.meta}>
            {s.kelas} · {s.lab}
          </Text>
          <Text style={styles.meta}>{formatTanggal(s.tanggal)}</Text>
          <Text style={styles.meta}>
            {titik(s.jamMulai)}–{titik(s.jamSelesai)}
          </Text>
        </View>

        <View style={styles.kotak}>
          <Text style={styles.eyebrow}>Materi / Pembahasan</Text>
          <Text style={styles.deskripsi}>{s.deskripsi}</Text>
        </View>

        {/* Tombol utama: hanya satu, sesuai status (DESIGN.md §4.4) */}
        {s.status === 'TERJADWAL' && (
          <Tombol variant="primer" onPress={() => mulai(s.id, 'buka')}>
            Buka Sesi
          </Tombol>
        )}
        {s.status === 'DIBUKA' && (
          <Tombol variant="graphite" onPress={() => mulai(s.id, 'tutup')}>
            Tutup Sesi
          </Tombol>
        )}
        {s.status === 'SELESAI' && (
          <Tombol
            variant="sekunder"
            style={styles.tombolBukaLagi}
            onPress={() => mulai(s.id, 'bukaLagi')}
          >
            Buka Lagi
          </Tombol>
        )}

        {/* Daftar hadir (live dari context) */}
        <View style={styles.hadirHeader}>
          <Text style={styles.h2}>Kehadiran ({daftarHadir.length})</Text>
          <Tombol variant="ghost" style={styles.rekapTombol} onPress={bukaRekap}>
            Lihat rekap
          </Tombol>
        </View>

        {daftarHadir.length === 0 ? (
          <EmptyState
            judul="Belum ada yang presensi"
            pesan="Kehadiran praktikan akan muncul saat mereka presensi."
          />
        ) : (
          <View style={styles.daftar}>
            {daftarHadir.map((k, index) => (
              <View
                key={k.id}
                style={[styles.baris, index > 0 && styles.barisGaris]}
              >
                <Text style={styles.barisNama} numberOfLines={1}>
                  {namaPraktikan(k.praktikanId)}
                </Text>
                <Text style={styles.barisWaktu}>{titik(formatJam(k.waktuHadir))}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingBottom: spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s1,
    paddingHorizontal: spacing.s2,
    borderRadius: radius.button,
  },
  navButtonPressed: { backgroundColor: colors.surfaceMuted },
  navButtonIcon: { fontSize: 24, color: colors.textPrimary, lineHeight: 26, marginRight: 4 },
  navButtonText: { ...type.bodyStrong, color: colors.textPrimary },

  content: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s8,
    gap: spacing.s5,
  },
  contentKosong: { padding: spacing.s5, gap: spacing.s4 },

  kotak: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: spacing.s1,
  },
  h1: { ...type.h1, color: colors.textPrimary, marginBottom: spacing.s1 },
  h2: { ...type.h2, color: colors.textPrimary },
  meta: { ...type.body, color: colors.textSecondary },
  deskripsi: { ...type.body, color: colors.textPrimary },
  eyebrow: {
    ...type.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.s1,
  },

  tombolBukaLagi: { borderColor: colors.primaryPressed, borderWidth: 2 },

  hadirHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rekapTombol: { height: 40, minHeight: 40, paddingHorizontal: spacing.s3 },

  daftar: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.s4,
  },
  baris: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s3,
    gap: spacing.s2,
  },
  barisGaris: { borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  barisNama: { ...type.bodyStrong, color: colors.textPrimary, flex: 1 },
  barisWaktu: { ...type.body, color: colors.textSecondary },
});
