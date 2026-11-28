import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, Check, FileText, Sparkles } from 'lucide-react-native';

import {
  formatSentimenAi,
  labelStatusIzin,
  resolveSentimenAi,
} from '@/components/praktikan/formatIzin';
import { EmptyState, StatusBadge } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { type StatusIzin } from '@/data/dummy';
import { formatLabelKategoriAi } from '@/services/ai';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, formatJam, titikJam } from '@/utils/format';

type Catatan = {
  id: string;
  jenis: 'HADIR' | 'IZIN' | 'ALPHA';
  sesiId: string;
  waktu: string;
  jarak?: number;
  statusIzin?: StatusIzin;
  alasan?: string;
  kategoriAi?: string;
  ringkasanAi?: string;
  sentimenAi?: string;
};

export default function RiwayatScreen() {
  const { themeColors } = usePreferences();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const {
    currentUser,
    sesi,
    kehadiran,
    izin,
    getStatusEfektif,
    loading,
    error,
    retrySync,
  } = useSession();

  const daftarCatatan = useMemo<Catatan[]>(() => {
    if (!currentUser) return [];
    const sesiAda = new Set(sesi.map((s) => s.id));
    const normKelas = (k?: string) => (k ?? '').trim().toUpperCase();
    const kelasSaya = normKelas(currentUser.kelas);

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
        alasan: i.alasan,
        kategoriAi: i.kategoriAi,
        ringkasanAi: i.ringkasanAi,
        sentimenAi: i.sentimenAi,
      }));

    const sesiTercatat = new Set<string>([
      ...hadirItems.map((h) => h.sesiId),
      ...izinItems.map((i) => i.sesiId),
    ]);

    // Fallback otomatis Alpha untuk sesi kelas praktikan yang sudah SELESAI tanpa presensi / izin
    const alphaItems: Catatan[] = sesi
      .filter(
        (s) =>
          getStatusEfektif(s) === 'SELESAI' &&
          (!kelasSaya || normKelas(s.kelas) === kelasSaya) &&
          !sesiTercatat.has(s.id),
      )
      .map((s) => ({
        id: `alpha-${s.id}`,
        jenis: 'ALPHA',
        sesiId: s.id,
        waktu: `${s.tanggal}T${s.jamSelesai}:00`,
      }));

    return [...hadirItems, ...izinItems, ...alphaItems].sort((a, b) =>
      (b.waktu || '').localeCompare(a.waktu || ''),
    );
  }, [currentUser, sesi, kehadiran, izin, getStatusEfektif]);

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
            {t('riwayat.kicker')}
          </Text>
          <Text style={[styles.h1, { color: themeColors.textPrimary }]}>
            {t('riwayat.title')}
          </Text>
          <Text style={[styles.sub, { color: themeColors.textSecondary }]}>
            {t('riwayat.subtitle')}
          </Text>
        </View>

        {error ? (
          <EmptyState
            judul={t('riwayat.loadError')}
            pesan={error}
            aksi={{
              label: t('common.retry'),
              onPress: retrySync,
            }}
          />
        ) : loading ? (
          <EmptyState
            judul={t('riwayat.loadingTitle')}
            pesan={t('common.pleaseWait')}
          />
        ) : daftarCatatan.length === 0 ? (
          <EmptyState
            judul={t('riwayat.emptyTitle')}
            pesan={t('riwayat.emptyBody')}
          />
        ) : (
          <View style={styles.historyList}>
            {daftarCatatan.map((item) => {
              const s = sesiMap.get(item.sesiId);
              if (!s) return null;

              const isHadir = item.jenis === 'HADIR';
              const isAlpha = item.jenis === 'ALPHA';
              const infoAi = formatLabelKategoriAi(
                item.kategoriAi,
                item.ringkasanAi,
                isEn,
              );
              const aiTidakTersedia =
                !infoAi.terklasifikasi || !(item.ringkasanAi ?? '').trim();
              const sentimenEfektif = resolveSentimenAi(
                item.sentimenAi,
                item.alasan,
                infoAi.terklasifikasi,
              );
              const sentimen = formatSentimenAi(sentimenEfektif, isEn);
              const statusInfo = item.statusIzin
                ? labelStatusIzin(item.statusIzin, isEn)
                : null;

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
                          : isAlpha
                            ? themeColors.errorBg
                            : themeColors.izinBg,
                      },
                    ]}
                  >
                    {isHadir ? (
                      <Check size={18} color={themeColors.sesiDibukaFg} />
                    ) : isAlpha ? (
                      <AlertCircle size={18} color={themeColors.errorFg} />
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
                      {isAlpha
                        ? `${titikJam(s.jamMulai)}–${titikJam(s.jamSelesai)}`
                        : titikJam(formatJam(item.waktu))}
                      {isHadir && typeof item.jarak === 'number'
                        ? ` · ${Math.round(item.jarak)} m`
                        : ''}
                    </Text>
                    {!isHadir && !isAlpha ? (
                      <View style={styles.izinMetaGroup}>
                        {statusInfo ? (
                          <Text
                            style={[
                              styles.izinStatusNote,
                              item.statusIzin === 'DITERIMA' &&
                                styles.izinStatusNoteBold,
                              {
                                color:
                                  item.statusIzin === 'DITERIMA'
                                    ? themeColors.sesiDibukaFg
                                    : item.statusIzin === 'MENUNGGU'
                                      ? themeColors.izinFg
                                      : themeColors.textSecondary,
                              },
                            ]}
                          >
                            {item.statusIzin === 'DITERIMA'
                              ? t('izin.excused')
                              : item.statusIzin === 'MENUNGGU'
                                ? t('riwayat.pendingNote')
                                : statusInfo.keterangan}
                          </Text>
                        ) : null}

                        {aiTidakTersedia ? (
                          <View
                            style={[
                              styles.aiChip,
                              { backgroundColor: themeColors.gpsOffBg },
                            ]}
                          >
                            <Sparkles size={11} color={themeColors.gpsOffFg} />
                            <Text
                              style={[
                                styles.aiChipText,
                                { color: themeColors.gpsOffFg },
                              ]}
                              numberOfLines={1}
                            >
                              {t('izin.aiUnavailable')}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.aiChipsRow}>
                            <View
                              style={[
                                styles.aiChip,
                                { backgroundColor: themeColors.primarySoft },
                              ]}
                            >
                              <Sparkles
                                size={11}
                                color={themeColors.sesiDibukaFg}
                              />
                              <Text
                                style={[
                                  styles.aiChipText,
                                  { color: themeColors.sesiDibukaFg },
                                ]}
                                numberOfLines={1}
                              >
                                {t('riwayat.aiLabelChip', { label: infoAi.label })}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.aiChip,
                                {
                                  backgroundColor: sentimen.tersedia
                                    ? themeColors.primarySoft
                                    : themeColors.gpsOffBg,
                                },
                              ]}
                            >
                              <Sparkles
                                size={11}
                                color={
                                  sentimen.tersedia
                                    ? themeColors.sesiDibukaFg
                                    : themeColors.gpsOffFg
                                }
                              />
                              <Text
                                style={[
                                  styles.aiChipText,
                                  {
                                    color: sentimen.tersedia
                                      ? themeColors.sesiDibukaFg
                                      : themeColors.gpsOffFg,
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {sentimen.tersedia
                                  ? t('izin.sentiment', { label: sentimen.label })
                                  : t('izin.sentimentUnavailable')}
                              </Text>
                            </View>
                          </View>
                        )}
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
                        {t('riwayat.presentBadge')}
                      </Text>
                    </View>
                  ) : isAlpha ? (
                    <StatusBadge status="ALPHA" />
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
  izinMetaGroup: {
    gap: 4,
    marginTop: 2,
  },
  izinStatusNote: {
    ...type.micro,
    lineHeight: 15,
  },
  izinStatusNoteBold: {
    fontFamily: fontFamily.bold,
  },
  aiChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
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
