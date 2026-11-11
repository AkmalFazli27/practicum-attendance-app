import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tanggalSingkat, titik } from '@/components/asisten/helpers';
import { EmptyState, SheetModal } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { formatJam } from '@/utils/format';

// Rekap kehadiran (FR-08)
export default function RekapScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ sesiId?: string; t?: string }>();
  const { currentUser, users, sesi, getKehadiranSesi } = useSession();

  const [pilihId, setPilihId] = useState<string | undefined>(params.sesiId);
  const [sheetPilih, setSheetPilih] = useState(false);

  // "Lihat rekap" dari detail mengirim sesiId (+ t agar efek selalu jalan).
  useEffect(() => {
    if (params.sesiId) setPilihId(params.sesiId);
  }, [params.sesiId, params.t]);

  const sesiSaya = useMemo(
    () =>
      sesi
        .filter((s) => s.asistenId === currentUser?.id)
        .sort((a, b) =>
          `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`),
        ),
    [sesi, currentUser?.id],
  );

  if (!currentUser) return null; // guard di _layout yang me-redirect

  const terpilih =
    sesiSaya.find((s) => s.id === pilihId) ??
    sesiSaya.find((s) => s.status === 'DIBUKA') ??
    sesiSaya[0];

  if (!terpilih) {
    return (
      <View style={styles.root}>
        <View style={[styles.content, { paddingTop: insets.top + spacing.s4 }]}>
          <Text style={styles.h1}>Rekap kehadiran</Text>
          <EmptyState
            judul="Belum ada sesi"
            pesan="Sesi yang kamu kelola akan tampil di sini."
          />
        </View>
      </View>
    );
  }

  const daftarHadir = getKehadiranSesi(terpilih.id)
    .slice()
    .sort((a, b) => a.waktuHadir.localeCompare(b.waktuHadir));

  // Total = praktikan pada kelas sesi tersebut.
  const total = users.filter(
    (u) => u.peran === 'praktikan' && u.kelas === terpilih.kelas,
  ).length;
  const persen = total > 0 ? Math.min(100, Math.round((daftarHadir.length / total) * 100)) : 0;

  const namaPraktikan = (praktikanId: string) =>
    users.find((u) => u.id === praktikanId)?.nama ?? 'Praktikan';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.s4 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Rekap kehadiran</Text>

        {/* Selector sesi */}
        <View style={styles.selectorWrap}>
          <Text style={styles.label}>Pilih sesi</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sesi dipilih: ${terpilih.namaPraktikum} ${terpilih.kelas}. Ketuk untuk mengganti.`}
            onPress={() => setSheetPilih(true)}
            style={({ pressed }) => [styles.selector, pressed && styles.selectorPressed]}
          >
            <Text style={styles.selectorText} numberOfLines={1}>
              {terpilih.namaPraktikum} · {terpilih.kelas}
            </Text>
            <Text style={styles.selectorCaret}>▾</Text>
          </Pressable>
        </View>

        {/* Ringkasan */}
        <View style={styles.ringkasan}>
          <Text style={styles.ringkasanTeks}>
            {daftarHadir.length} dari {total} praktikan hadir
          </Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${persen}%` }]} />
          </View>
          <Text style={styles.ringkasanPersen}>{persen}%</Text>
        </View>

        {/* Daftar hadir */}
        <Text style={styles.h2}>Daftar hadir</Text>
        {daftarHadir.length === 0 ? (
          <EmptyState
            judul="Belum ada kehadiran"
            pesan="Belum ada praktikan yang tercatat pada sesi ini."
          />
        ) : (
          <View style={styles.daftar}>
            {daftarHadir.map((k, index) => (
              <View key={k.id} style={[styles.baris, index > 0 && styles.barisGaris]}>
                <Text style={styles.barisNama} numberOfLines={1}>
                  {namaPraktikan(k.praktikanId)}
                </Text>
                <Text style={styles.barisWaktu}>{titik(formatJam(k.waktuHadir))}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Hadir</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sheet pemilih sesi */}
      <SheetModal
        visible={sheetPilih}
        judul="Pilih sesi"
        onClose={() => setSheetPilih(false)}
      >
        {sesiSaya.map((s) => {
          const aktif = s.id === terpilih.id;
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityState={{ selected: aktif }}
              onPress={() => {
                setPilihId(s.id);
                setSheetPilih(false);
              }}
              style={({ pressed }) => [
                styles.opsi,
                aktif && styles.opsiAktif,
                pressed && styles.selectorPressed,
              ]}
            >
              <Text style={styles.opsiNama} numberOfLines={1}>
                {s.namaPraktikum} · {s.kelas}
              </Text>
              <Text style={styles.opsiMeta}>
                {tanggalSingkat(s.tanggal)} · {titik(s.jamMulai)}–{titik(s.jamSelesai)}
              </Text>
            </Pressable>
          );
        })}
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.s5, paddingBottom: spacing.s8, gap: spacing.s5 },
  h1: { ...type.h1, color: colors.textPrimary },
  h2: { ...type.h2, color: colors.textPrimary },
  label: { ...type.caption, color: colors.textMuted },

  selectorWrap: { gap: spacing.s2 },
  selector: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectorPressed: { backgroundColor: colors.surfaceMuted },
  selectorText: { ...type.bodyStrong, color: colors.textPrimary, flex: 1 },
  selectorCaret: { ...type.body, color: colors.textSecondary },

  ringkasan: {
    backgroundColor: colors.graphite,
    borderRadius: radius.card,
    padding: spacing.s4,
    gap: spacing.s3,
  },
  ringkasanTeks: { ...type.h2, color: colors.onGraphite },
  barTrack: {
    height: 8,
    borderRadius: radius.badge,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: radius.badge, backgroundColor: colors.primary },
  ringkasanPersen: { ...type.caption, color: colors.onGraphite, opacity: 0.7 },

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
    paddingVertical: spacing.s3,
    gap: spacing.s3,
  },
  barisGaris: { borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  barisNama: { ...type.bodyStrong, color: colors.textPrimary, flex: 1 },
  barisWaktu: { ...type.body, color: colors.textSecondary },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.badge,
    backgroundColor: colors.sesiDibukaBg,
  },
  badgeText: { ...type.caption, color: colors.sesiDibukaFg, fontFamily: fontFamily.semibold },

  opsi: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  opsiAktif: { borderColor: colors.primaryPressed, backgroundColor: colors.primarySoft },
  opsiNama: { ...type.bodyStrong, color: colors.textPrimary },
  opsiMeta: { ...type.caption, color: colors.textSecondary },
});
