import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, FileText } from 'lucide-react-native';

import { EmptyState, StatusBadge } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type StatusIzin } from '@/data/dummy';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, formatJam, titikJam } from '@/utils/format';

type Catatan = {
  id: string;
  jenis: 'HADIR' | 'IZIN';
  sesiId: string;
  waktu: string;
  statusIzin?: StatusIzin;
  kategoriAi?: string;
};

export default function RiwayatScreen() {
  const { currentUser, sesi, kehadiran, izin, loading } = useSession();

  const daftarCatatan = useMemo<Catatan[]>(() => {
    if (!currentUser) return [];
    const sesiAda = new Set(sesi.map((s) => s.id));

    const hadirItems: Catatan[] = kehadiran
      .filter((k) => k.praktikanId === currentUser.id && sesiAda.has(k.sesiId))
      .map((k) => ({
        id: `hadir-${k.id}`,
        jenis: 'HADIR',
        sesiId: k.sesiId,
        waktu: k.waktuHadir,
      }));

    const izinItems: Catatan[] = izin
      .filter((i) => i.praktikanId === currentUser.id && sesiAda.has(i.sesiId))
      .map((i) => ({
        id: `izin-${i.id}`,
        jenis: 'IZIN',
        sesiId: i.sesiId,
        waktu: i.waktuPengajuan,
        statusIzin: i.status,
        kategoriAi: i.kategoriAi,
      }));

    return [...hadirItems, ...izinItems].sort((a, b) =>
      (b.waktu || '').localeCompare(a.waktu || ''),
    );
  }, [currentUser, sesi, kehadiran, izin]);

  const sesiMap = useMemo(() => new Map(sesi.map((s) => [s.id, s])), [sesi]);

  if (!currentUser) return null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitle}>
          <Text style={styles.kicker}>CATATANMU</Text>
          <Text style={styles.h1}>Riwayat kehadiran</Text>
          <Text style={styles.sub}>
            Semua presensi dan status pengajuan izinmu.
          </Text>
        </View>

        {loading ? (
          <EmptyState judul="Memuat riwayat…" pesan="Mohon tunggu sebentar." />
        ) : daftarCatatan.length === 0 ? (
          <EmptyState
            judul="Belum ada riwayat"
            pesan="Presensi berhasil dan pengajuan izin akan muncul di halaman ini."
          />
        ) : (
          <View style={styles.historyList}>
            {daftarCatatan.map((item) => {
              const s = sesiMap.get(item.sesiId);
              if (!s) return null;

              const isHadir = item.jenis === 'HADIR';

              return (
                <View key={item.id} style={styles.historyRow}>
                  <View
                    style={[
                      styles.iconTile,
                      isHadir ? styles.iconTileHadir : styles.iconTileIzin,
                    ]}
                  >
                    {isHadir ? (
                      <Check size={18} color={colors.sesiDibukaFg} />
                    ) : (
                      <FileText size={18} color={colors.izinFg} />
                    )}
                  </View>

                  <View style={styles.historyMain}>
                    <Text style={styles.historyName} numberOfLines={1}>
                      {s.namaPraktikum}
                    </Text>
                    <Text style={styles.historyMeta} numberOfLines={1}>
                      {formatHariTanggalSingkat(s.tanggal)} ·{' '}
                      {titikJam(formatJam(item.waktu))}
                      {item.kategoriAi ? ` · AI: ${item.kategoriAi}` : ''}
                    </Text>
                  </View>

                  {isHadir ? (
                    <View style={styles.presentBadge}>
                      <Text style={styles.presentBadgeText}>Hadir</Text>
                    </View>
                  ) : item.statusIzin ? (
                    <StatusBadge status={item.statusIzin} />
                  ) : null}
                </View>
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
    gap: spacing.s5,
  },
  pageTitle: { gap: 2 },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.15,
    marginBottom: 4,
  },
  h1: { ...type.h1, color: colors.textPrimary },
  sub: { ...type.caption, color: colors.textSecondary, marginTop: 5 },
  historyList: { gap: 10 },
  historyRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    padding: 13,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileHadir: { backgroundColor: colors.sesiDibukaBg },
  iconTileIzin: { backgroundColor: colors.izinBg },
  historyMain: { flex: 1, gap: 4 },
  historyName: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  historyMeta: { ...type.caption, color: colors.textMuted },
  presentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.sesiDibukaBg,
  },
  presentBadgeText: { ...type.micro, color: colors.sesiDibukaFg },
});