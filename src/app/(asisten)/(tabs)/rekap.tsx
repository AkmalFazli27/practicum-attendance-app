import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { SinkronGuard } from '@/components/asisten/SyncState';
import { EmptyState, StatusBadge, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { formatJam, getTileTanggal, titikJam } from '@/utils/format';

type Entri = {
  id: string;
  nama: string;
  nim: string;
  waktu: string;
  kind: 'hadir' | 'izin';
  status?: 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';
};

export default function RekapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sesiId?: string; t?: string }>();
  const { currentUser, users, sesi, kehadiran, izin } = useSession();

  // Sesi yang dibuka dari tombol "Lihat di tab Rekap" langsung terbentang.
  const [terbuka, setTerbuka] = useState<string | null>(params.sesiId ?? null);
  useEffect(() => {
    if (params.sesiId) setTerbuka(params.sesiId);
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

  const rekap = useMemo(() => {
    const peta = new Map(users.map((u) => [u.id, u]));
    const infoNama = (
      praktikanId: string,
      nama?: string,
      nim?: string,
    ): { nama: string; nim: string } => ({
      nama: nama || peta.get(praktikanId)?.nama || 'Praktikan',
      nim: nim || peta.get(praktikanId)?.nim || '-',
    });

    return new Map(
      sesiSaya.map((s) => {
        const hadir: Entri[] = kehadiran
          .filter((k) => k.sesiId === s.id)
          .sort((a, b) => a.waktuHadir.localeCompare(b.waktuHadir))
          .map((k) => ({
            id: `h-${k.id}`,
            ...infoNama(k.praktikanId, k.namaPraktikan, k.nimPraktikan),
            waktu: k.waktuHadir,
            kind: 'hadir' as const,
          }));
        const daftarIzin = izin.filter((i) => i.sesiId === s.id);
        const izinEntri: Entri[] = daftarIzin
          .slice()
          .sort((a, b) => a.waktuPengajuan.localeCompare(b.waktuPengajuan))
          .map((i) => ({
            id: `i-${i.id}`,
            ...infoNama(i.praktikanId, i.namaPraktikan, i.nimPraktikan),
            waktu: i.waktuPengajuan,
            kind: 'izin' as const,
            status: i.status,
          }));

        return [
          s.id,
          {
            hadir: hadir.length,
            diterima: daftarIzin.filter((i) => i.status === 'DITERIMA').length,
            menunggu: daftarIzin.filter((i) => i.status === 'MENUNGGU').length,
            entri: [...hadir, ...izinEntri],
          },
        ] as const;
      }),
    );
  }, [sesiSaya, users, kehadiran, izin]);

  if (!currentUser) return null;

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(asisten)/sesi/[id]', params: { id } } as any);

  const renderSesi = (session: Sesi) => {
    const data = rekap.get(session.id);
    if (!data) return null;
    const tile = getTileTanggal(session.tanggal);
    const sedangBuka = terbuka === session.id;

    return (
      <View key={session.id} style={styles.recapCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: sedangBuka }}
          accessibilityLabel={`Rekap ${session.namaPraktikum}, ${data.hadir} hadir`}
          onPress={() => setTerbuka(sedangBuka ? null : session.id)}
          style={({ pressed }) => [
            styles.recapRow,
            pressed && styles.recapRowPressed,
          ]}
        >
          <View style={styles.recapDateTile}>
            <Text style={styles.recapDateDay}>{tile.hari}</Text>
            <Text style={styles.recapDateMonth}>{tile.bulan}</Text>
          </View>

          <View style={styles.recapMain}>
            <Text style={styles.recapName} numberOfLines={1}>
              {session.namaPraktikum}
            </Text>
            <Text style={styles.recapMeta} numberOfLines={1}>
              {session.kelas} · {session.lab}
              {data.menunggu > 0 ? ` · ${data.menunggu} izin menunggu` : ''}
            </Text>
          </View>

          <View style={styles.recapTotal}>
            <Text style={styles.recapCount}>{data.hadir}</Text>
            <Text style={styles.recapCountLabel}>hadir</Text>
          </View>

          {sedangBuka ? (
            <ChevronUp size={18} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={18} color={colors.textSecondary} />
          )}
        </Pressable>

        {sedangBuka && (
          <View style={styles.detail}>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {data.hadir}
                  <Text style={styles.statSub}>/{session.kapasitas ?? 32}</Text>
                </Text>
                <Text style={styles.statLabel}>Hadir</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{data.diterima}</Text>
                <Text style={styles.statLabel}>Izin diterima</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{data.menunggu}</Text>
                <Text style={styles.statLabel}>Izin menunggu</Text>
              </View>
            </View>

            {data.entri.length === 0 ? (
              <Text style={styles.emptyList}>
                Belum ada presensi atau pengajuan izin pada sesi ini.
              </Text>
            ) : (
              <View>
                {data.entri.map((e) => (
                  <View key={e.id} style={styles.entriRow}>
                    <View style={styles.entriInfo}>
                      <Text style={styles.entriNama} numberOfLines={1}>
                        {e.nama}
                      </Text>
                      <Text style={styles.entriNim}>{e.nim}</Text>
                    </View>
                    {e.kind === 'hadir' ? (
                      <Text style={styles.entriWaktu}>
                        Hadir {titikJam(formatJam(e.waktu))}
                      </Text>
                    ) : (
                      e.status && <StatusBadge status={e.status} />
                    )}
                  </View>
                ))}
              </View>
            )}

            <Tombol
              variant="sekunder"
              onPress={() => bukaDetail(session.id)}
              style={styles.detailBtn}
            >
              Buka detail sesi
            </Tombol>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitle}>
          <Text style={styles.kicker}>MONITOR</Text>
          <Text style={styles.h1}>Rekap kehadiran</Text>
          <Text style={styles.sub}>
            Ringkasan kehadiran dan izin seluruh sesi.
          </Text>
        </View>

        <SinkronGuard adaData={sesiSaya.length > 0}>
          {sesiSaya.length === 0 ? (
            <EmptyState
              judul="Belum ada sesi"
              pesan="Sesi yang kamu kelola akan tampil di sini."
            />
          ) : (
            <View style={styles.recapList}>{sesiSaya.map(renderSesi)}</View>
          )}
        </SinkronGuard>
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
    gap: spacing.s5,
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
  recapList: {
    gap: 10,
  },
  recapCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  recapRow: {
    minHeight: 77,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    padding: 12,
  },
  recapRowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  recapDateTile: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapDateDay: {
    fontSize: 18,
    lineHeight: 21,
    fontFamily: fontFamily.extrabold,
    color: colors.onGraphite,
  },
  recapDateMonth: {
    ...type.micro,
    color: colors.primary,
  },
  recapMain: {
    flex: 1,
    gap: 4,
  },
  recapName: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  recapMeta: {
    ...type.caption,
    color: colors.textMuted,
  },
  recapTotal: {
    alignItems: 'flex-end',
  },
  recapCount: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
  },
  recapCountLabel: {
    ...type.micro,
    color: colors.textMuted,
  },
  detail: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.s3,
    gap: spacing.s3,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.s2,
  },
  statBox: {
    flex: 1,
    padding: spacing.s3,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
  },
  statSub: {
    ...type.caption,
    color: colors.textMuted,
  },
  statLabel: {
    ...type.micro,
    color: colors.textMuted,
  },
  emptyList: {
    ...type.caption,
    color: colors.textMuted,
  },
  entriRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.s2,
  },
  entriInfo: {
    flex: 1,
  },
  entriNama: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  entriNim: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  entriWaktu: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  detailBtn: {
    minHeight: 42,
  },
});
