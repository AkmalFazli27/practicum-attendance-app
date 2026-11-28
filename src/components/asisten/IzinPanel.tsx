import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ConfirmSheet, StatusBadge, Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { type Izin } from '@/data/dummy';
import {
  formatLabelKategoriAi,
  KATEGORI_FALLBACK,
  KATEGORI_IZIN_RESMI,
} from '@/services/ai';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { formatJam, titikJam } from '@/utils/format';

type Keputusan = 'DITERIMA' | 'DITOLAK';
type Target = { izinId: string; keputusan: Keputusan };

const SEMUA = 'SEMUA';

const kategoriIzin = (i: Izin): string =>
  !i.kategoriAi || i.kategoriAi === KATEGORI_FALLBACK
    ? KATEGORI_FALLBACK
    : i.kategoriAi;

function AiInfo({ item }: { item: Izin }) {
  const { t, i18n } = useTranslation();
  const { themeColors } = usePreferences();
  const isEn = i18n.language === 'en';
  const infoAi = formatLabelKategoriAi(item.kategoriAi, item.ringkasanAi, isEn);
  const tidakTersedia = !infoAi.terklasifikasi;

  const s = (item.sentimenAi ?? '').trim().toLowerCase();
  const labelSentimen = !s
    ? t('asprak.sentimentUnavailable')
    : s.includes('positif') || s.includes('positive')
      ? t('asprak.sentimentPositive')
      : s.includes('negatif') || s.includes('negative')
        ? t('asprak.sentimentNegative')
        : s.includes('netral') || s.includes('neutral')
          ? t('asprak.sentimentNeutral')
          : item.sentimenAi!.trim();

  return (
    <View
      style={[
        styles.aiBox,
        {
          backgroundColor: tidakTersedia
            ? themeColors.surfaceMuted
            : themeColors.primarySoft,
        },
      ]}
    >
      <View style={styles.aiRow}>
        <Sparkles
          size={14}
          color={
            tidakTersedia ? themeColors.textMuted : themeColors.sesiDibukaFg
          }
        />
        <Text
          style={[
            styles.aiTitle,
            {
              color: tidakTersedia
                ? themeColors.textMuted
                : themeColors.sesiDibukaFg,
            },
          ]}
        >
          {tidakTersedia
            ? t('asprak.leaveAiUnclassified')
            : t('asprak.leaveAiLabelWithSentiment', {
                label: infoAi.label,
                sentiment: labelSentimen,
              })}
        </Text>
      </View>
      {tidakTersedia && (
        <Text style={[styles.aiSummary, { color: themeColors.textMuted }]}>
          {t('asprak.leaveSentimentLine', { sentiment: labelSentimen })}
        </Text>
      )}
      {item.ringkasanAi ? (
        <Text
          style={[styles.aiSummary, { color: themeColors.textSecondary }]}
        >
          {item.ringkasanAi}
        </Text>
      ) : null}
      <Text style={[styles.aiFootnote, { color: themeColors.textMuted }]}>
        {t('izin.supportingNote')}
      </Text>
    </View>
  );
}

export function IzinPanel({ sesiId }: { sesiId: string }) {
  const { t, i18n } = useTranslation();
  const { users, error, clearError, getIzinSesi, reviewIzin } = useSession();
  const { showToast } = useToast();
  const { themeColors } = usePreferences();
  const isEn = i18n.language === 'en';

  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>(SEMUA);

  const errorRef = useRef<string | null>(null);
  errorRef.current = error;

  const terakhir = useRef<Target | null>(null);
  if (target) terakhir.current = target;

  const daftarIzin = getIzinSesi(sesiId)
    .slice()
    .sort((a, b) => b.waktuPengajuan.localeCompare(a.waktuPengajuan));

  const jumlahPerKategori = new Map<string, number>();
  for (const i of daftarIzin) {
    const k = kategoriIzin(i);
    jumlahPerKategori.set(k, (jumlahPerKategori.get(k) ?? 0) + 1);
  }
  const opsiFilter: string[] = [...KATEGORI_IZIN_RESMI, KATEGORI_FALLBACK].filter(
    (k) => (jumlahPerKategori.get(k) ?? 0) > 0,
  );
  const filterAktif = opsiFilter.some((k) => k === filter) ? filter : SEMUA;
  const daftarTampil =
    filterAktif === SEMUA
      ? daftarIzin
      : daftarIzin.filter((i) => kategoriIzin(i) === filterAktif);

  const infoPraktikan = useMemo(() => {
    const peta = new Map(users.map((u) => [u.id, u]));
    return (item: Izin) => {
      const user = peta.get(item.praktikanId);
      return {
        nama: item.namaPraktikan || user?.nama || t('asprak.studentLabel'),
        nim: item.nimPraktikan || user?.nim || '-',
      };
    };
  }, [users, t]);

  const copyMap: Record<Keputusan, { judul: string; isi: string; ya: string; toast: string }> = {
    DITERIMA: {
      judul: t('asprak.approveConfirmTitle'),
      isi: t('asprak.approveConfirmBody'),
      ya: t('asprak.approveConfirmBtn'),
      toast: t('asprak.approveToast'),
    },
    DITOLAK: {
      judul: t('asprak.rejectConfirmTitle'),
      isi: t('asprak.rejectConfirmBody'),
      ya: t('asprak.rejectConfirmBtn'),
      toast: t('asprak.rejectToast'),
    },
  };

  const tampil = target ?? terakhir.current;
  const izinTampil = tampil ? daftarIzin.find((i) => i.id === tampil.izinId) : undefined;
  const copy = tampil ? copyMap[tampil.keputusan] : copyMap.DITERIMA;
  const tolak = tampil?.keputusan === 'DITOLAK';

  const batal = () => {
    if (loading) return;
    setTarget(null);
  };

  const konfirmasi = async () => {
    if (!target || loading) return;
    const { izinId, keputusan } = target;

    const saatIni = getIzinSesi(sesiId).find((i) => i.id === izinId);
    if (!saatIni || saatIni.status !== 'MENUNGGU') {
      setTarget(null);
      showToast(t('asprak.leaveAlreadyReviewed'));
      return;
    }

    clearError();
    setLoading(true);
    const hasil = await reviewIzin(izinId, keputusan);
    setLoading(false);
    setTarget(null);

    if (hasil.ok) {
      showToast(
        hasil.notifGagal
          ? `${copyMap[keputusan].toast}${t('asprak.leaveNotifFailedSuffix')}`
          : copyMap[keputusan].toast,
      );
      return;
    }
    await new Promise((r) => setTimeout(r, 60));
    showToast(errorRef.current ?? t('asprak.leaveSaveFailed'));
  };

  const menunggu = daftarIzin.filter((i) => i.status === 'MENUNGGU').length;

  return (
    <View
      style={[
        styles.panel,
        {
          borderColor: themeColors.border,
          backgroundColor: themeColors.surface,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
          {t('asprak.leavePanelKicker')}
        </Text>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
          {t('asprak.leavePanelTitle', { count: daftarIzin.length })}
          {menunggu > 0
            ? t('asprak.leavePanelPending', { count: menunggu })
            : ''}
        </Text>
      </View>

      {opsiFilter.length >= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          {[SEMUA, ...opsiFilter].map((k) => {
            const aktif = k === filterAktif;
            const jumlah =
              k === SEMUA ? daftarIzin.length : jumlahPerKategori.get(k) ?? 0;
            const label =
              k === SEMUA
                ? t('common.all')
                : k === KATEGORI_FALLBACK
                  ? t('asprak.leaveUnclassified')
                  : k;
            return (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityState={{ selected: aktif }}
                onPress={() => setFilter(k)}
                style={[
                  styles.chip,
                  {
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surface,
                  },
                  aktif && {
                    borderColor: themeColors.primary,
                    backgroundColor: themeColors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: themeColors.textSecondary },
                    aktif && { color: themeColors.onPrimary },
                  ]}
                >
                  {label} · {jumlah}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {daftarIzin.length === 0 ? (
        <Text
          style={[
            styles.empty,
            {
              borderTopColor: themeColors.border,
              color: themeColors.textMuted,
            },
          ]}
        >
          {t('asprak.leaveEmpty')}
        </Text>
      ) : (
        <View style={styles.list}>
          {daftarTampil.map((item) => {
            const mhs = infoPraktikan(item);
            return (
              <View
                key={item.id}
                style={[styles.card, { borderTopColor: themeColors.border }]}
              >
                <View style={styles.topRow}>
                  <View style={styles.userInfo}>
                    <Text
                      style={[styles.name, { color: themeColors.textPrimary }]}
                    >
                      {mhs.nama}
                    </Text>
                    <Text
                      style={[styles.nim, { color: themeColors.textMuted }]}
                    >
                      {t('asprak.leaveSubmittedAt', {
                        nim: mhs.nim,
                        jam: titikJam(formatJam(item.waktuPengajuan)),
                      })}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text
                  style={[styles.alasan, { color: themeColors.textSecondary }]}
                >
                  "{item.alasan}"
                </Text>

                <AiInfo item={item} />

                {item.status === 'DITERIMA' && (
                  <View
                    style={[
                      styles.excusedBanner,
                      { backgroundColor: themeColors.kehadiranTepatWaktuBg },
                    ]}
                  >
                    <ShieldCheck
                      size={14}
                      color={themeColors.kehadiranTepatWaktuFg}
                    />
                    <Text
                      style={[
                        styles.excusedText,
                        { color: themeColors.kehadiranTepatWaktuFg },
                      ]}
                    >
                      {t('izin.excused')}
                    </Text>
                  </View>
                )}

                {item.status === 'MENUNGGU' && (
                  <View style={styles.actions}>
                    <Tombol
                      variant="danger"
                      icon={<X size={16} color={themeColors.errorFg} />}
                      style={styles.btn}
                      onPress={() =>
                        setTarget({ izinId: item.id, keputusan: 'DITOLAK' })
                      }
                    >
                      {t('asprak.rejectBtn')}
                    </Tombol>
                    <Tombol
                      variant="primer"
                      icon={<Check size={16} color={themeColors.onPrimary} />}
                      style={styles.btn}
                      onPress={() =>
                        setTarget({ izinId: item.id, keputusan: 'DITERIMA' })
                      }
                    >
                      {t('asprak.approveLeaveBtn')}
                    </Tombol>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <ConfirmSheet
        visible={target !== null}
        title={copy.judul}
        body={copy.isi}
        danger={tolak}
        loading={loading}
        confirmLabel={copy.ya}
        summary={
          izinTampil
            ? [
                {
                  label: t('asprak.studentLabel'),
                  value: infoPraktikan(izinTampil).nama,
                },
                {
                  label: t('asprak.aiAnalysisLabel'),
                  value:
                    formatLabelKategoriAi(
                      izinTampil.kategoriAi,
                      izinTampil.ringkasanAi,
                      isEn,
                    ).label,
                },
              ]
            : []
        }
        onConfirm={konfirmasi}
        onClose={batal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.s4,
    padding: spacing.s4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: {
    marginBottom: spacing.s3,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  title: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  empty: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s3,
    ...type.caption,
    color: colors.textMuted,
  },
  chipScroll: {
    flexGrow: 0,
    marginBottom: spacing.s3,
  },
  chipRow: {
    gap: spacing.s2,
  },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: {
    ...type.micro,
    fontFamily: fontFamily.semibold,
  },
  list: {
    gap: spacing.s3,
  },
  card: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s3,
    gap: spacing.s2 + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  nim: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  alasan: {
    ...type.caption,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  aiBox: {
    padding: spacing.s3,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    gap: 4,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
    flex: 1,
  },
  aiSummary: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  aiFootnote: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  excusedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.button,
  },
  excusedText: {
    ...type.micro,
    fontFamily: fontFamily.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s2,
    marginTop: 2,
  },
  btn: {
    flex: 1,
    minHeight: 42,
  },
});