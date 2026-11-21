import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from 'lucide-react-native';

import { formatJarak } from '@/components/asisten/formatJarak';
import { ErrorBlock, LoadingBlock } from '@/components/asisten/SyncState';
import { EmptyState, StatusBadge, Tombol } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
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
  jarak?: number;
};

type RekapSesi = {
  hadir: number;
  diterima: number;
  menunggu: number;
  entri: Entri[];
};

type RingkasanPraktikum = {
  nama: string;
  sesi: Sesi[];
  hadir: number;
  menunggu: number;
};

export default function RekapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sesiId?: string; t?: string }>();
  const { currentUser, users, sesi, kehadiran, izin, loading, error, retrySync } =
    useSession();
  const { themeColors } = usePreferences();

  // Level 1 = daftar praktikum (null). Level 2 = daftar praktikan per sesi.
  const [praktikum, setPraktikum] = useState<string | null>(null);
  const [terbuka, setTerbuka] = useState<string | null>(null);

  const sesiSaya = useMemo(
    () =>
      sesi
        .filter((s) => s.asistenId === currentUser?.id)
        .sort((a, b) =>
          `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`),
        ),
    [sesi, currentUser?.id],
  );

  // Dibuka dari tombol "Lihat di tab Rekap": langsung ke praktikum dan sesi itu.
  // Dijalankan sekali per navigasi supaya tombol kembali tidak tertimpa.
  const terapkanRef = useRef<string | null>(null);
  useEffect(() => {
    if (!params.sesiId) return;
    const kunci = `${params.sesiId}|${params.t ?? ''}`;
    if (terapkanRef.current === kunci) return;
    const target = sesiSaya.find((s) => s.id === params.sesiId);
    if (!target) return;
    terapkanRef.current = kunci;
    setPraktikum(target.namaPraktikum);
    setTerbuka(target.id);
  }, [params.sesiId, params.t, sesiSaya]);

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

    return new Map<string, RekapSesi>(
      sesiSaya.map((s) => {
        const hadir: Entri[] = kehadiran
          .filter((k) => k.sesiId === s.id)
          .sort((a, b) => a.waktuHadir.localeCompare(b.waktuHadir))
          .map((k) => ({
            id: `h-${k.id}`,
            ...infoNama(k.praktikanId, k.namaPraktikan, k.nimPraktikan),
            waktu: k.waktuHadir,
            kind: 'hadir' as const,
            jarak: k.jarak,
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

  const daftarPraktikum = useMemo(() => {
    const peta = new Map<string, RingkasanPraktikum>();
    for (const s of sesiSaya) {
      const data = rekap.get(s.id);
      const ada = peta.get(s.namaPraktikum) ?? {
        nama: s.namaPraktikum,
        sesi: [],
        hadir: 0,
        menunggu: 0,
      };
      ada.sesi.push(s);
      ada.hadir += data?.hadir ?? 0;
      ada.menunggu += data?.menunggu ?? 0;
      peta.set(s.namaPraktikum, ada);
    }
    return Array.from(peta.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [sesiSaya, rekap]);

  if (!currentUser) return null;

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(asisten)/sesi/[id]', params: { id } } as any);

  const kembaliKePraktikum = () => {
    setPraktikum(null);
    setTerbuka(null);
  };

  const belumAdaData = sesiSaya.length === 0;
  const sesiPraktikum = praktikum
    ? sesiSaya.filter((s) => s.namaPraktikum === praktikum)
    : [];

  const renderSesi = (session: Sesi) => {
    const data = rekap.get(session.id);
    if (!data) return null;
    const tile = getTileTanggal(session.tanggal);
    const sedangBuka = terbuka === session.id;

    return (
      <View
        key={session.id}
        style={[
          styles.recapCard,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: sedangBuka }}
          accessibilityLabel={`Rekap ${session.namaPraktikum} ${session.kelas}, ${data.hadir} hadir`}
          onPress={() => setTerbuka(sedangBuka ? null : session.id)}
          style={({ pressed }) => [
            styles.recapRow,
            pressed && { backgroundColor: themeColors.surfaceMuted },
          ]}
        >
          <View
            style={[
              styles.recapDateTile,
              { backgroundColor: themeColors.primarySoft },
            ]}
          >
            <Text
              style={[styles.recapDateDay, { color: themeColors.textPrimary }]}
            >
              {tile.hari}
            </Text>
            <Text
              style={[
                styles.recapDateMonth,
                { color: themeColors.textSecondary },
              ]}
            >
              {tile.bulan}
            </Text>
          </View>

          <View style={styles.recapMain}>
            <Text
              style={[styles.recapName, { color: themeColors.textPrimary }]}
              numberOfLines={1}
            >
              {session.kelas} · {session.lab}
            </Text>
            <Text
              style={[styles.recapMeta, { color: themeColors.textMuted }]}
              numberOfLines={1}
            >
              {titikJam(session.jamMulai)}–{titikJam(session.jamSelesai)}
              {data.menunggu > 0 ? ` · ${data.menunggu} izin menunggu` : ''}
            </Text>
          </View>

          <View style={styles.recapTotal}>
            <Text
              style={[styles.recapCount, { color: themeColors.textPrimary }]}
            >
              {data.hadir}
            </Text>
            <Text
              style={[styles.recapCountLabel, { color: themeColors.textMuted }]}
            >
              hadir
            </Text>
          </View>

          {sedangBuka ? (
            <ChevronUp size={18} color={themeColors.textSecondary} />
          ) : (
            <ChevronDown size={18} color={themeColors.textSecondary} />
          )}
        </Pressable>

        {sedangBuka && (
          <View style={[styles.detail, { borderTopColor: themeColors.border }]}>
            <View style={styles.statRow}>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.statValue, { color: themeColors.textPrimary }]}
                >
                  {data.hadir}
                  <Text
                    style={[styles.statSub, { color: themeColors.textMuted }]}
                  >
                    /{session.kapasitas ?? 32}
                  </Text>
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  Hadir
                </Text>
              </View>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.statValue, { color: themeColors.textPrimary }]}
                >
                  {data.diterima}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  Izin diterima
                </Text>
              </View>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.statValue, { color: themeColors.textPrimary }]}
                >
                  {data.menunggu}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  Izin menunggu
                </Text>
              </View>
            </View>

            {data.entri.length === 0 ? (
              <Text
                style={[styles.emptyList, { color: themeColors.textMuted }]}
              >
                Belum ada presensi atau pengajuan izin pada sesi ini.
              </Text>
            ) : (
              <View>
                {data.entri.map((e) => (
                  <View
                    key={e.id}
                    style={[
                      styles.entriRow,
                      { borderTopColor: themeColors.border },
                    ]}
                  >
                    <View style={styles.entriInfo}>
                      <Text
                        style={[
                          styles.entriNama,
                          { color: themeColors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {e.nama}
                      </Text>
                      <Text
                        style={[
                          styles.entriNim,
                          { color: themeColors.textMuted },
                        ]}
                      >
                        {e.nim}
                      </Text>
                    </View>
                    {e.kind === 'hadir' ? (
                      <View style={styles.entriKanan}>
                        <Text
                          style={[
                            styles.entriWaktu,
                            { color: themeColors.sesiDibukaFg },
                          ]}
                        >
                          Hadir {titikJam(formatJam(e.waktu))}
                        </Text>
                        {e.jarak !== undefined && (
                          <Text
                            style={[
                              styles.entriJarak,
                              { color: themeColors.textMuted },
                            ]}
                          >
                            {formatJarak(e.jarak)}
                          </Text>
                        )}
                      </View>
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

  const renderPraktikum = (p: RingkasanPraktikum) => (
    <Pressable
      key={p.nama}
      accessibilityRole="button"
      accessibilityLabel={`${p.nama}, ${p.sesi.length} sesi, ${p.hadir} hadir`}
      onPress={() => {
        setPraktikum(p.nama);
        setTerbuka(null);
      }}
      style={({ pressed }) => [
        styles.recapCard,
        styles.recapRow,
        {
          backgroundColor: pressed
            ? themeColors.surfaceMuted
            : themeColors.surface,
          borderColor: themeColors.border,
        },
      ]}
    >
      <View style={styles.recapMain}>
        <Text
          style={[styles.recapName, { color: themeColors.textPrimary }]}
          numberOfLines={1}
        >
          {p.nama}
        </Text>
        <Text
          style={[styles.recapMeta, { color: themeColors.textMuted }]}
          numberOfLines={1}
        >
          {p.sesi.length} sesi
          {p.menunggu > 0 ? ` · ${p.menunggu} izin menunggu` : ''}
        </Text>
      </View>
      <View style={styles.recapTotal}>
        <Text style={[styles.recapCount, { color: themeColors.textPrimary }]}>
          {p.hadir}
        </Text>
        <Text
          style={[styles.recapCountLabel, { color: themeColors.textMuted }]}
        >
          hadir
        </Text>
      </View>
      <ChevronRight size={18} color={themeColors.textSecondary} />
    </Pressable>
  );

  const renderIsi = () => {
    if (belumAdaData && loading) {
      return <LoadingBlock pesan="Memuat rekap..." />;
    }
    if (belumAdaData && error) {
      return <ErrorBlock pesan={error} onRetry={retrySync} />;
    }

    // Level 1: pilih praktikum.
    if (praktikum === null) {
      if (daftarPraktikum.length === 0) {
        return (
          <EmptyState
            judul="Belum ada sesi"
            pesan="Sesi yang kamu kelola akan tampil di sini."
          />
        );
      }
      return <View style={styles.recapList}>{daftarPraktikum.map(renderPraktikum)}</View>;
    }

    // Level 2: daftar praktikan per sesi dari praktikum terpilih.
    if (sesiPraktikum.length === 0) {
      return (
        <EmptyState
          judul="Sesi tidak ditemukan"
          pesan="Praktikum ini tidak lagi memiliki sesi. Kembali untuk memilih praktikum lain."
        />
      );
    }
    return <View style={styles.recapList}>{sesiPraktikum.map(renderSesi)}</View>;
  };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitle}>
          {praktikum !== null && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali ke daftar praktikum"
              onPress={kembaliKePraktikum}
              style={({ pressed }) => [
                styles.backBtn,
                pressed && { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <ArrowLeft size={18} color={themeColors.textPrimary} />
              <Text
                style={[styles.backText, { color: themeColors.textPrimary }]}
              >
                Semua praktikum
              </Text>
            </Pressable>
          )}
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            MONITOR
          </Text>
          <Text style={[styles.h1, { color: themeColors.textPrimary }]}>
            {praktikum ?? 'Rekap kehadiran'}
          </Text>
          <Text style={[styles.sub, { color: themeColors.textSecondary }]}>
            {praktikum
              ? 'Daftar praktikan dan jarak presensi per sesi.'
              : 'Pilih praktikum untuk melihat rekap kehadiran dan izin.'}
          </Text>
        </View>

        {renderIsi()}
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
  backBtn: {
    alignSelf: 'flex-start',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    paddingRight: spacing.s3,
    marginBottom: spacing.s2,
    borderRadius: 12,
  },
  backText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
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
  entriKanan: {
    alignItems: 'flex-end',
  },
  entriWaktu: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  entriJarak: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  detailBtn: {
    minHeight: 42,
  },
});
