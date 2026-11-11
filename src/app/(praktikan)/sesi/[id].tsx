import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PresensiSheet } from '@/components/praktikan/PresensiSheet';
import { EmptyState, StatusBadge, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { formatJam, formatTanggal } from '@/utils/format';

const titik = (jam: string) => jam.replace(':', '.');

export default function DetailSesiPraktikan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, getSesiById, sudahPresensi } = useSession();
  const [sheetBuka, setSheetBuka] = useState(false);

  const s = getSesiById(id);

  // Nav bar: sama seperti navBar di layar login (ikon, teks, efek tekan).
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

  // Sesi tidak ada, atau bukan milik kelas praktikan ini.
  if (!currentUser || !s || s.kelas !== currentUser.kelas) {
    return (
      <View style={styles.root}>
        {navBar()}
        <View style={styles.contentKosong}>
          <EmptyState
            judul="Sesi tidak ditemukan"
            pesan="Sesi ini tidak tersedia untuk kelasmu."
          />
        </View>
      </View>
    );
  }

  const hadir = sudahPresensi(s.id, currentUser.id);
  const waktuHadir = hadir ? titik(formatJam(hadir.waktuHadir)) : null;

  return (
    <View style={styles.root}>
      {navBar(<StatusBadge status={s.status} />)}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info sesi */}
        <View style={styles.kotak}>
          <Text style={styles.h1}>{s.namaPraktikum}</Text>
          <Text style={styles.meta}>{s.kelas} · {s.lab}</Text>
          <Text style={styles.meta}>{formatTanggal(s.tanggal)}</Text>
          <Text style={styles.meta}>{titik(s.jamMulai)}–{titik(s.jamSelesai)}</Text>
        </View>

        <View style={styles.kotak}>
          <Text style={styles.eyebrow}>Materi / Pembahasan</Text>
          <Text style={styles.deskripsi}>{s.deskripsi}</Text>
        </View>

        {/* Banner status pribadi */}
        {hadir ? (
          <View style={[styles.banner, styles.bannerSudah]}>
            <Text style={styles.bannerSudahText}>Presensi tercatat pukul {waktuHadir}</Text>
            <Text style={styles.bannerCatatan}>Tersimpan di perangkat</Text>
          </View>
        ) : s.status === 'DIBUKA' ? (
          <View style={[styles.banner, styles.bannerNetral]}>
            <Text style={styles.bannerNetralText}>Belum presensi pada sesi ini</Text>
          </View>
        ) : (
          <View style={[styles.banner, styles.bannerNetral]}>
            <Text style={styles.bannerNetralText}>
              {s.status === 'TERJADWAL' ? 'Sesi belum dibuka.' : 'Sesi sudah ditutup.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Tombol presensi (4 state) */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.s4 }]}>
        {hadir ? (
          <View
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            style={styles.tombolHadir}
          >
            <Text style={styles.tombolHadirText}>✓ Sudah Presensi {waktuHadir}</Text>
          </View>
        ) : s.status === 'DIBUKA' ? (
          <Tombol variant="primer" onPress={() => setSheetBuka(true)}>
            Presensi Sekarang
          </Tombol>
        ) : (
          <Tombol variant="primer" disabled>
            {s.status === 'TERJADWAL' ? 'Sesi Belum Dibuka' : 'Sesi Selesai'}
          </Tombol>
        )}
      </View>

      <PresensiSheet sesi={sheetBuka ? s : null} onClose={() => setSheetBuka(false)} />
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
  navButtonIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 26,
    marginRight: 4,
  },
  navButtonText: { ...type.bodyStrong, color: colors.textPrimary },

  content: { paddingHorizontal: spacing.s5, paddingTop: spacing.s4, paddingBottom: spacing.s6, gap: spacing.s5 },
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
  meta: { ...type.body, color: colors.textSecondary },
  deskripsi: { ...type.body, color: colors.textPrimary },
  eyebrow: {
    ...type.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.s1,
    },

  banner: { borderRadius: radius.button, padding: spacing.s4, gap: spacing.s1 },
  bannerNetral: { backgroundColor: colors.surfaceMuted },
  bannerNetralText: { ...type.body, color: colors.textSecondary },
  bannerSudah: { backgroundColor: colors.sesiDibukaBg },
  bannerSudahText: { ...type.bodyStrong, color: colors.sesiDibukaFg },
  bannerCatatan: { ...type.caption, color: colors.sesiDibukaFg },

  footer: { paddingHorizontal: spacing.s5, paddingTop: spacing.s3 },
  tombolHadir: {
    height: 50,
    borderRadius: radius.button,
    backgroundColor: colors.sesiDibukaBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tombolHadirText: { ...type.bodyStrong, color: colors.sesiDibukaFg },
});