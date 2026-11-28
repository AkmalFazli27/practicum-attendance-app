import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { BadgeKehadiran } from '@/components/asisten/BadgeKehadiran';
import { formatJarak } from '@/components/asisten/formatJarak';
import { idPraktikanSesi } from '@/components/asisten/ringkasanPresensi';
import { ErrorBlock, LoadingBlock } from '@/components/asisten/SyncState';
import { useSesiAsprak } from '@/components/asisten/useSesiAsprak';
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
  kind: 'hadir' | 'izin' | 'alpha';
  status?: 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';
  kategoriAi?: string;
  jarak?: number;
  statusKehadiran?: 'TEPAT_WAKTU' | 'TERLAMBAT';
  menitTerlambat?: number;
};

type RekapSesi = {
  hadir: number;
  diterima: number;
  menunggu: number;
  alpha: number;
  entri: Entri[];
};

type RingkasanPraktikum = {
  nama: string;
  sesi: Sesi[];
  hadir: number;
  menunggu: number;
};

export default function RekapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ sesiId?: string; t?: string }>();
  const {
    currentUser,
    users,
    kehadiran,
    izin,
    keanggotaanLab,
    getStatusEfektif,
    loading,
    error,
    retrySync,
  } = useSession();
  const { sesiSaya } = useSesiAsprak();
  const { themeColors } = usePreferences();

  // Level 1 = daftar praktikum (null). Level 2 = daftar praktikan per sesi.
  const [praktikum, setPraktikum] = useState<string | null>(null);
  const [terbuka, setTerbuka] = useState<string | null>(null);

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
      nama: nama || peta.get(praktikanId)?.nama || t('asprak.studentLabel'),
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
            statusKehadiran: k.statusKehadiran ?? 'TEPAT_WAKTU',
            menitTerlambat: k.menitTerlambat,
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
            kategoriAi: i.kategoriAi,
          }));

        const sesiSelesai = getStatusEfektif(s) === 'SELESAI';
        const sudahAdaIds = new Set<string>([
          ...kehadiran
            .filter((k) => k.sesiId === s.id)
            .map((k) => k.praktikanId),
          ...daftarIzin
            .filter((i) => i.status !== 'DITOLAK')
            .map((i) => i.praktikanId),
        ]);
        const targetIds = new Set(idPraktikanSesi(s, users, keanggotaanLab));
        const alphaEntri: Entri[] = sesiSelesai
          ? users
              .filter((u) => targetIds.has(u.id) && !sudahAdaIds.has(u.id))
              .sort((a, b) => a.nama.localeCompare(b.nama))
              .map((u) => ({
                id: `a-${s.id}-${u.id}`,
                nama: u.nama,
                nim: u.nim || '-',
                waktu: '',
                kind: 'alpha' as const,
              }))
          : [];

        return [
          s.id,
          {
            hadir: hadir.length,
            diterima: daftarIzin.filter((i) => i.status === 'DITERIMA').length,
            menunggu: daftarIzin.filter((i) => i.status === 'MENUNGGU').length,
            alpha: alphaEntri.length,
            entri: [...hadir, ...izinEntri, ...alphaEntri],
          },
        ] as const;
      }),
    );
  }, [sesiSaya, users, kehadiran, izin, keanggotaanLab, getStatusEfektif, t]);

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
              {data.menunggu > 0
                ? t('asprak.recapPendingMeta', { count: data.menunggu })
                : ''}
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
              {t('asprak.recapPresentUnit')}
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
                  {t('asprak.recapStatPresent')}
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
                  {data.diterima + data.menunggu}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {t('asprak.recapStatLeave')}
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
                  style={[
                    styles.statValue,
                    {
                      color:
                        data.alpha > 0
                          ? themeColors.errorFg
                          : themeColors.textPrimary,
                    },
                  ]}
                >
                  {data.alpha}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {t('asprak.recapStatAlpha')}
                </Text>
              </View>
            </View>

            {data.entri.length === 0 ? (
              <Text
                style={[styles.emptyList, { color: themeColors.textMuted }]}
              >
                {t('asprak.recapEmptyEntries')}
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
                      {e.kind === 'izin' && e.status === 'DITERIMA' && (
                        <Text
                          style={[
                            styles.excusedHint,
                            { color: themeColors.kehadiranTepatWaktuFg },
                          ]}
                        >
                          {t('izin.excused')}
                        </Text>
                      )}
                    </View>
                    {e.kind === 'hadir' ? (
                      <View style={styles.entriKanan}>
                        <Text
                          style={[
                            styles.entriWaktu,
                            { color: themeColors.sesiDibukaFg },
                          ]}
                        >
                          {t('asprak.recapPresentAt', {
                            jam: titikJam(formatJam(e.waktu)),
                          })}
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
                        <BadgeKehadiran
                          status={e.statusKehadiran}
                          menit={e.menitTerlambat}
                        />
                      </View>
                    ) : e.kind === 'alpha' ? (
                      <StatusBadge status="ALPHA" />
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
              {t('asprak.recapOpenDetail')}
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
          {t('asprak.recapSessionMeta', { count: p.sesi.length })}
          {p.menunggu > 0
            ? t('asprak.recapPendingMeta', { count: p.menunggu })
            : ''}
        </Text>
      </View>
      <View style={styles.recapTotal}>
        <Text style={[styles.recapCount, { color: themeColors.textPrimary }]}>
          {p.hadir}
        </Text>
        <Text
          style={[styles.recapCountLabel, { color: themeColors.textMuted }]}
        >
          {t('asprak.recapPresentUnit')}
        </Text>
      </View>
      <ChevronRight size={18} color={themeColors.textSecondary} />
    </Pressable>
  );

  const renderIsi = () => {
    if (belumAdaData && loading) {
      return <LoadingBlock pesan={t('asprak.recapLoading')} />;
    }
    if (belumAdaData && error) {
      return <ErrorBlock pesan={error} onRetry={retrySync} />;
    }

    if (praktikum === null) {
      if (daftarPraktikum.length === 0) {
        return (
          <EmptyState
            judul={t('asprak.emptySessionsTitle')}
            pesan={t('asprak.emptyManageBody')}
          />
        );
      }
      return <View style={styles.recapList}>{daftarPraktikum.map(renderPraktikum)}</View>;
    }

    if (sesiPraktikum.length === 0) {
      return (
        <EmptyState
          judul={t('asprak.sessionNotFound')}
          pesan={t('asprak.recapPracticumNotFound')}
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
              accessibilityLabel={t('asprak.recapBackAria')}
              onPress={kembaliKePraktikum}
              style={({ pressed }) => [
                styles.backBtn,
                {
                  borderColor: themeColors.border,
                  backgroundColor: pressed
                    ? themeColors.surfaceMuted
                    : themeColors.surface,
                },
              ]}
            >
              <ArrowLeft size={18} color={themeColors.textPrimary} />
              <Text
                style={[styles.backText, { color: themeColors.textPrimary }]}
              >
                {t('asprak.recapBackAll')}
              </Text>
            </Pressable>
          )}
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            MONITOR
          </Text>
          <Text style={[styles.h1, { color: themeColors.textPrimary }]}>
            {praktikum ?? t('asprak.recapTitle')}
          </Text>
          <Text style={[styles.sub, { color: themeColors.textSecondary }]}>
            {praktikum
              ? t('asprak.recapSubDetail')
              : t('asprak.recapSubList')}
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    paddingHorizontal: spacing.s3,
    marginBottom: spacing.s2,
    borderRadius: 13,
    borderWidth: 1,
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
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.s2 + 2,
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
  excusedHint: {
    fontSize: 10,
    fontFamily: fontFamily.semibold,
    marginTop: 3,
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