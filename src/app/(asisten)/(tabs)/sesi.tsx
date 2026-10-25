import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { titik, tanggalSingkat } from '@/components/asisten/helpers';
import { useAksiSesi } from '@/components/asisten/useAksiSesi';
import { EmptyState, StatusBadge, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { formatTanggal, nowLocalISO } from '@/utils/format';

// Sesi = beranda asisten (FR-03)
export default function SesiAsistenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, sesi, getKehadiranSesi } = useSession();
  const { mulai, sheet } = useAksiSesi();

  // Hanya sesi milik asisten yang login, urut tanggal lalu jam mulai.
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

  const jumlah = {
    DIBUKA: sesiSaya.filter((s) => s.status === 'DIBUKA').length,
    TERJADWAL: sesiSaya.filter((s) => s.status === 'TERJADWAL').length,
    SELESAI: sesiSaya.filter((s) => s.status === 'SELESAI').length,
  };

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(asisten)/sesi/[id]', params: { id } } as any);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.s4 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Sapaan */}
        <View>
          <Text style={styles.h1}>Halo, {currentUser.nama.split(' ')[0]}</Text>
          <Text style={styles.sub}>
            Asisten · {formatTanggal(nowLocalISO().slice(0, 10))}
          </Text>
        </View>

        {/* 2. Kartu ringkasan (dari data yang sama, bukan data baru) */}
        <View style={styles.ringkasan}>
          <View style={styles.statRow}>
            <Stat angka={jumlah.DIBUKA} label="Dibuka" />
            <Stat angka={jumlah.TERJADWAL} label="Terjadwal" />
            <Stat angka={jumlah.SELESAI} label="Selesai" />
          </View>
          <Text style={styles.ringkasanTotal}>{sesiSaya.length} sesi total</Text>
        </View>

        {/* 3. Daftar sesi */}
        <Text style={styles.h2}>Sesi saya</Text>

        {sesiSaya.length === 0 ? (
          <EmptyState
            judul="Belum ada sesi"
            pesan="Sesi yang kamu kelola akan tampil di sini."
          />
        ) : (
          <View style={styles.list}>
            {sesiSaya.map((s) => {
              const hadir = getKehadiranSesi(s.id).length;
              return (
                <View key={s.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {s.namaPraktikum}
                    </Text>
                    <StatusBadge status={s.status} />
                  </View>
                  <Text style={styles.cardMeta}>
                    {s.kelas} · {s.lab}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {tanggalSingkat(s.tanggal)} · {titik(s.jamMulai)}–{titik(s.jamSelesai)}
                  </Text>
                  {s.status !== 'TERJADWAL' && (
                    <Text style={styles.cardHadir}>Hadir {hadir} orang</Text>
                  )}

                  <View style={styles.aksiRow}>
                    {s.status === 'TERJADWAL' && (
                      <Tombol
                        variant="sekunder"
                        style={styles.aksiTombol}
                        onPress={() => mulai(s.id, 'buka')}
                      >
                        Buka
                      </Tombol>
                    )}
                    {s.status === 'DIBUKA' && (
                      <Tombol
                        variant="sekunder"
                        style={styles.aksiTombol}
                        onPress={() => mulai(s.id, 'tutup')}
                      >
                        Tutup
                      </Tombol>
                    )}
                    <Tombol
                      variant="sekunder"
                      style={styles.aksiTombol}
                      onPress={() => bukaDetail(s.id)}
                    >
                      Detail
                    </Tombol>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {sheet}
    </View>
  );
}

function Stat({ angka, label }: { angka: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statAngka}>{angka}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.s5, paddingBottom: spacing.s8, gap: spacing.s6 },
  h1: { ...type.h1, color: colors.textPrimary },
  h2: { ...type.h2, color: colors.textPrimary },
  sub: { ...type.body, color: colors.textSecondary },

  ringkasan: {
    backgroundColor: colors.graphite,
    borderRadius: radius.card,
    padding: spacing.s4,
    gap: spacing.s3,
  },
  statRow: { flexDirection: 'row', gap: spacing.s2 },
  stat: { flex: 1, gap: spacing.s1, alignItems: 'center' },
  statAngka: { ...type.h1, color: colors.onGraphite, textAlign: 'center' },
  statLabel: { ...type.caption, color: colors.onGraphite, opacity: 0.7, textAlign: 'center' },
  ringkasanTotal: { ...type.caption, color: colors.onGraphite, opacity: 0.7, textAlign: 'center' },

  list: { gap: spacing.s3 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: spacing.s1,
  },
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
  aksiRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.s2,
    marginTop: spacing.s3,
  },
  aksiTombol: { height: 44, minHeight: 44, paddingHorizontal: spacing.s5 },
});
