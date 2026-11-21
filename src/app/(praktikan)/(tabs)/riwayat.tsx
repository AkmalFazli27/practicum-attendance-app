import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, FileText, Sparkles } from 'lucide-react-native';

import { EmptyState, StatusBadge } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { type StatusIzin } from '@/data/dummy';
import { KATEGORI_FALLBACK } from '@/services/ai';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, formatJam, titikJam } from '@/utils/format';

type Catatan = {
  id: string;
  jenis: 'HADIR' | 'IZIN';
  sesiId: string;
  waktu: string;
  jarak?: number;
  statusIzin?: StatusIzin;
  kategoriAi?: string;
  ringkasanAi?: string;
};

export default function RiwayatScreen() {
  const { themeColors } = usePreferences();
  const { currentUser, sesi, kehadiran, izin, loading, error, retrySync } =
    useSession();

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
        jarak: k.jarak,
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
        ringkasanAi: i.ringkasanAi,
      }));

    return [...hadirItems, ...izinItems].sort((a, b) =>
      (b.waktu || '').localeCompare(a.waktu || ''),
    );
  }, [currentUser, sesi, kehadiran, izin]);

  const sesiMap = useMemo(() => new Map(sesi.map((s) => [s.id, s])), [sesi]);

  if (!currentUser) return null;

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitle}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            CATATANMU
          </Text>
          <Text style={[styles.h1, { color: themeColors.textPrimary }]}>
            Riwayat kehadiran
          </Text>
          <Text style={[styles.sub, { color: themeColors.textSecondary }]}>
            Semua presensi dan status pengajuan izinmu.
          </Text>
        </View>

        {error ? (
          <EmptyState
            judul="Gagal memuat riwayat"
            pesan={error}
            aksi={{ label: 'Coba lagi', onPress: retrySync }}
          />
        ) : loading ? (
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
              const aiTidakTersedia =
                !item.kategoriAi ||
                item.kategoriAi === KATEGORI_FALLBACK ||
                /fallback/i.test(item.ringkasanAi ?? '');

              return (
                <View
                  key={item.id}
                  style={[
                    styles.historyRow,
                    {
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.surface,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconTile,
                      {
                        backgroundColor: isHadir
                          ? themeColors.sesiDibukaBg
                          : themeColors.izinBg,
                      },
                    ]}
                  >
                    {isHadir ? (
                      <Check size={18} color={themeColors.sesiDibukaFg} />
                    ) : (
                      <FileText size={18} color={themeColors.izinFg} />
                    )}
                  </View>

                  <View style={styles.historyMain}>
                    <Text
                      style={[
                        styles.historyName,
                        { color: themeColors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {s.namaPraktikum}
                    </Text>
                    <Text
                      style={[
                        styles.historyMeta,
                        { color: themeColors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {formatHariTanggalSingkat(s.tanggal)} ·{' '}
                      {titikJam(formatJam(item.waktu))}
                      {isHadir && typeof item.jarak === 'number'
                        ? ` · ${Math.round(item.jarak)} m`
                        : ''}
                    </Text>
                    {!isHadir ? (
                      <View
                        style={[
                          styles.aiChip,
                          {
                            backgroundColor: aiTidakTersedia
                              ? themeColors.gpsOffBg
                              : themeColors.primarySoft,
                          },
                        ]}
                      >
                        <Sparkles
                          size={11}
                          color={
                            aiTidakTersedia
                              ? themeColors.gpsOffFg
                              : themeColors.sesiDibukaFg
                          }
                        />
                        <Text
                          style={[
                            styles.aiChipText,
                            {
                              color: aiTidakTersedia
                                ? themeColors.gpsOffFg
                                : themeColors.sesiDibukaFg,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {aiTidakTersedia
                            ? 'AI tidak tersedia · Belum terklasifikasi'
                            : `AI: ${item.kategoriAi}`}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {isHadir ? (
                    <View
                      style={[
                        styles.presentBadge,
                        { backgroundColor: themeColors.sesiDibukaBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presentBadgeText,
                          { color: themeColors.sesiDibukaFg },
                        ]}
                      >
                        Hadir
                      </Text>
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
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  aiChipMuted: {
    backgroundColor: colors.gpsOffBg,
  },
  aiChipText: {
    ...type.micro,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  aiChipTextMuted: {
    color: colors.gpsOffFg,
  },
  presentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.sesiDibukaBg,
  },
  presentBadgeText: { ...type.micro, color: colors.sesiDibukaFg },
});
