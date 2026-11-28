import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock3, MapPin, ReceiptText } from 'lucide-react-native';

import { EmptyState, StatusPembayaranBadge, Tombol } from '@/components/ui';
import { BannerGalat } from '@/components/praktikan/BannerGalat';
import {
  formatRupiah,
  formatTanggalTagihan,
} from '@/components/praktikan/formatTagihan';
import { usePembayaranTagihan } from '@/components/praktikan/usePembayaranTagihan';
import { useTagihanPraktikan } from '@/components/praktikan/useTagihanPraktikan';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/context/PreferencesContext';
import {
  fontFamily,
  layout,
  radius,
  shadows,
  spacing,
  type,
} from '@/theme/tokens';
import { formatJam, titikJam } from '@/utils/format';

export default function DetailTagihanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeColors, language } = usePreferences();
  const { t } = useTranslation();
  const isEn = language === 'en';
  const { daftar, pembayaran, kehadiran, loading, error, retrySync } =
    useTagihanPraktikan();
  const { bayar, cekStatus, memproses, memeriksa, galat, clearGalat } =
    usePembayaranTagihan();

  const item = daftar.find((x) => x.tagihan.id === id);
  const kehadiranItem = item
    ? kehadiran.find((k) => k.id === item.tagihan.kehadiranId)
    : undefined;
  const transaksi = item
    ? pembayaran
        .filter((p) => p.tagihanId === item.tagihan.id)
        .sort(
          (a, b) =>
            new Date(b.dibuatPada).getTime() -
            new Date(a.dibuatPada).getTime(),
        )
    : [];
  const orderPending = transaksi.find((p) => p.status === 'pending')?.id;
  const statusTagihan = item?.tagihan.status;
  const bisaBayarSekarang =
    statusTagihan === 'UNPAID' || statusTagihan === 'FAILED';

  const penjelasanStatus = (status: string): string => {
    switch (status) {
      case 'UNPAID':
        return t('tagihan.statusUnpaidDesc');
      case 'PENDING':
        return t('tagihan.statusPendingDesc');
      case 'PAID':
        return t('tagihan.paidAt');
      case 'FAILED':
        return t('tagihan.statusFailedDesc');
      case 'DIBEBASKAN':
        return t('tagihan.waivedReason');
      default:
        return '';
    }
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: themeColors.background, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            {
              borderColor: themeColors.border,
              backgroundColor: pressed
                ? themeColors.surfaceMuted
                : themeColors.surface,
            },
          ]}
        >
          <ChevronLeft size={20} color={themeColors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {t('tagihan.kicker')}
          </Text>
          <Text
            style={[styles.title, { color: themeColors.textPrimary }]}
            numberOfLines={1}
          >
            {t('tagihan.detailTitle')}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {galat ? (
          <BannerGalat pesan={galat} onTutup={clearGalat} />
        ) : null}

        {error ? (
          <EmptyState
            judul={t('tagihan.loadError')}
            pesan={error}
            aksi={{
              label: t('common.retry'),
              onPress: retrySync,
            }}
          />
        ) : loading && !item ? (
          <EmptyState
            judul={t('tagihan.loadingDetailTitle')}
            pesan={t('common.pleaseWait')}
          />
        ) : !item ? (
          <EmptyState
            judul={t('tagihan.notFound')}
            pesan={t('tagihan.notFoundBody')}
            aksi={{
              label: t('tagihan.backToList'),
              onPress: () =>
                router.replace('/(praktikan)/tagihan' as any),
            }}
          />
        ) : (
          <>
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroCopy}>
                  <Text
                    style={[styles.heroLabel, { color: themeColors.textMuted }]}
                  >
                    {t('tagihan.nominal')}
                  </Text>
                  <Text
                    style={[
                      styles.heroAmount,
                      { color: themeColors.textPrimary },
                    ]}
                  >
                    {formatRupiah(item.tagihan.nominal)}
                  </Text>
                </View>
                <StatusPembayaranBadge status={item.tagihan.status} />
              </View>
              <Text
                style={[
                  styles.heroDescription,
                  { color: themeColors.textSecondary },
                ]}
              >
                {penjelasanStatus(item.tagihan.status)}
                {item.tagihan.status === 'PAID' && item.tagihan.dibayarPada
                  ? ` ${formatTanggalTagihan(item.tagihan.dibayarPada, isEn)} · ${formatJam(item.tagihan.dibayarPada)}`
                  : ''}
              </Text>
            </View>

            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text
                style={[styles.sectionTitle, { color: themeColors.textPrimary }]}
              >
                {t('tagihan.sessionDetails')}
              </Text>

              <View style={styles.detailRow}>
                <ReceiptText size={17} color={themeColors.textMuted} />
                <View style={styles.detailCopy}>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: themeColors.textPrimary },
                    ]}
                  >
                    {item.judul}
                  </Text>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {item.sesi
                      ? `${formatTanggalTagihan(item.sesi.tanggal, isEn)} · ${titikJam(item.sesi.jamMulai)}–${titikJam(item.sesi.jamSelesai)}`
                      : formatTanggalTagihan(item.tagihan.dibuatPada, isEn)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MapPin size={17} color={themeColors.textMuted} />
                <View style={styles.detailCopy}>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: themeColors.textPrimary },
                    ]}
                  >
                    {item.lab?.nama ?? item.sesi?.lab ?? t('common.labFallback')}
                  </Text>
                  {item.sesi ? (
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {t('common.classWithValue', { kelas: item.sesi.kelas })}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.detailRow}>
                <Clock3 size={17} color={themeColors.textMuted} />
                <View style={styles.detailCopy}>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: themeColors.textPrimary },
                    ]}
                  >
                    {item.tagihan.menitTerlambat > 0
                      ? t('tagihan.lateMinutes', {
                          menit: item.tagihan.menitTerlambat,
                        })
                      : t('presensi.onTime')}
                  </Text>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {kehadiranItem
                      ? t('tagihan.checkedInAt', {
                          jam: formatJam(kehadiranItem.waktuHadir),
                        })
                      : t('tagihan.fineCalculated')}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text
                style={[styles.sectionTitle, { color: themeColors.textPrimary }]}
              >
                {t('tagihan.transactionHistory')}
              </Text>

              {transaksi.length === 0 ? (
                <Text
                  style={[
                    styles.emptyTransaction,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {t('pembayaran.noTransaction')}
                </Text>
              ) : (
                <View style={styles.transactionList}>
                  {transaksi.map((trx) => (
                    <View
                      key={trx.id}
                      style={[
                        styles.transactionRow,
                        { borderTopColor: themeColors.border },
                      ]}
                    >
                      <View style={styles.detailCopy}>
                        <Text
                          style={[
                            styles.detailValue,
                            { color: themeColors.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {trx.id}
                        </Text>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: themeColors.textSecondary },
                          ]}
                        >
                          {formatTanggalTagihan(trx.dibuatPada, isEn)}
                          {trx.metode ? ` · ${trx.metode}` : ''}
                        </Text>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text
                          style={[
                            styles.detailValue,
                            { color: themeColors.textPrimary },
                          ]}
                        >
                          {formatRupiah(trx.nominal)}
                        </Text>
                        <StatusPembayaranBadge status={trx.status} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {item.tagihan.status === 'PENDING' ? (
              <View
                style={[
                  styles.footerCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.footerNote,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {t('tagihan.pendingNote')}
                </Text>
                {orderPending ? (
                  <Tombol
                    variant="sekunder"
                    loading={memeriksa}
                    onPress={() => cekStatus(orderPending)}
                  >
                    {t('tagihan.checkStatus')}
                  </Tombol>
                ) : null}
              </View>
            ) : statusTagihan === 'PAID' ? (
              <View
                style={[
                  styles.footerCard,
                  {
                    backgroundColor: themeColors.pembayaranSuccessBg,
                    borderColor: themeColors.pembayaranSuccessFg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.footerTitle,
                    { color: themeColors.pembayaranSuccessFg },
                  ]}
                >
                  {t('tagihan.paidSuccessTitle')}
                </Text>
                {item.tagihan.dibayarPada ? (
                  <Text
                    style={[
                      styles.footerNote,
                      { color: themeColors.pembayaranSuccessFg },
                    ]}
                  >
                    {formatTanggalTagihan(item.tagihan.dibayarPada, isEn)} ·{' '}
                    {formatJam(item.tagihan.dibayarPada)}
                  </Text>
                ) : null}
              </View>
            ) : statusTagihan === 'DIBEBASKAN' ? (
              <View
                style={[
                  styles.footerCard,
                  {
                    backgroundColor: themeColors.pembayaranDibebaskanBg,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.footerTitle,
                    { color: themeColors.pembayaranDibebaskanFg },
                  ]}
                >
                  {t('tagihan.waivedTitle')}
                </Text>
                <Text
                  style={[
                    styles.footerNote,
                    { color: themeColors.pembayaranDibebaskanFg },
                  ]}
                >
                  {t('tagihan.waivedBody')}
                </Text>
              </View>
            ) : bisaBayarSekarang ? (
              <View
                style={[
                  styles.footerCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.footerNote,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {t('tagihan.payNote')}
                </Text>
                <Tombol
                  variant="primer"
                  loading={memproses}
                  onPress={() => bayar(item.tagihan.id)}
                >
                  {statusTagihan === 'FAILED'
                    ? t('tagihan.payAgain')
                    : t('tagihan.payNow')}
                </Tombol>
              </View>
            ) : null}

            <Text style={[styles.meta, { color: themeColors.textMuted }]}>
              {t('tagihan.recordedAt', {
                tanggal: formatTanggalTagihan(item.tagihan.dibuatPada, isEn),
                jam: formatJam(item.tagihan.dibuatPada),
              })}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 68,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.s2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    ...type.micro,
    letterSpacing: 1.1,
  },
  title: {
    ...type.h2,
  },
  headerSpacer: {
    width: 42,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s5,
    paddingBottom: spacing.s8,
    gap: spacing.s4,
  },
  heroCard: {
    padding: spacing.s4 + 2,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    gap: spacing.s3,
    ...shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.s3,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroLabel: {
    ...type.micro,
    letterSpacing: 1,
  },
  heroAmount: {
    ...type.h1,
  },
  heroDescription: {
    ...type.caption,
  },
  sectionCard: {
    padding: spacing.s4 + 2,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    gap: spacing.s3,
    ...shadows.card,
  },
  sectionTitle: {
    ...type.h3,
    marginBottom: spacing.s1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s3,
  },
  detailCopy: {
    flex: 1,
    gap: 2,
  },
  detailValue: {
    ...type.body,
  },
  detailLabel: {
    ...type.micro,
  },
  transactionList: {
    gap: spacing.s3,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.s3,
    paddingTop: spacing.s3,
    borderTopWidth: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  emptyTransaction: {
    ...type.caption,
  },
  footerCard: {
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    gap: spacing.s2,
  },
  footerTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
  },
  footerNote: {
    ...type.caption,
  },
  meta: {
    ...type.micro,
    textAlign: 'center',
  },
});
