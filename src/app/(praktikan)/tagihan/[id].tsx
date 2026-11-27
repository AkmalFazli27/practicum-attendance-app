import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock3, MapPin, ReceiptText } from 'lucide-react-native';

import { EmptyState, StatusPembayaranBadge } from '@/components/ui';
import {
  formatRupiah,
  formatTanggalTagihan,
} from '@/components/praktikan/formatTagihan';
import { useTagihanPraktikan } from '@/components/praktikan/useTagihanPraktikan';
import { usePreferences } from '@/context/PreferencesContext';
import {
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
  const isEn = language === 'en';
  const { daftar, pembayaran, kehadiran, loading, error, retrySync } =
    useTagihanPraktikan();

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

  const penjelasanStatus = (status: string): string => {
    switch (status) {
      case 'UNPAID':
        return isEn
          ? 'Unpaid — please pay before the deadline.'
          : 'Belum dibayar — bayar sebelum batas yang ditentukan.';
      case 'PENDING':
        return isEn
          ? 'Payment is being processed. The status will update automatically.'
          : 'Pembayaran sedang diproses. Status akan berubah otomatis.';
      case 'PAID':
        return isEn
          ? 'Paid.'
          : 'Lunas.';
      case 'FAILED':
        return isEn
          ? 'Payment failed. You can try again.'
          : 'Pembayaran gagal. Kamu dapat mencoba lagi.';
      case 'DIBEBASKAN':
        return isEn
          ? 'Bill waived because your leave was accepted.'
          : 'Tagihan dibebaskan karena izin diterima.';
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
          accessibilityLabel={isEn ? 'Back' : 'Kembali'}
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
            TAGIHAN
          </Text>
          <Text
            style={[styles.title, { color: themeColors.textPrimary }]}
            numberOfLines={1}
          >
            {isEn ? 'Bill details' : 'Detail tagihan'}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <EmptyState
            judul={isEn ? 'Failed to load bill' : 'Gagal memuat tagihan'}
            pesan={error}
            aksi={{
              label: isEn ? 'Try again' : 'Coba lagi',
              onPress: retrySync,
            }}
          />
        ) : loading && !item ? (
          <EmptyState
            judul={isEn ? 'Loading details…' : 'Memuat detail…'}
            pesan={isEn ? 'Please wait a moment.' : 'Mohon tunggu sebentar.'}
          />
        ) : !item ? (
          <EmptyState
            judul={isEn ? 'Bill not found' : 'Tagihan tidak ditemukan'}
            pesan={
              isEn
                ? 'This bill may have been removed or belongs to another account.'
                : 'Tagihan ini mungkin sudah dihapus atau milik akun lain.'
            }
            aksi={{
              label: isEn ? 'Back to bills' : 'Kembali ke daftar',
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
                    {isEn ? 'FINE AMOUNT' : 'NOMINAL DENDA'}
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
                {isEn ? 'Session details' : 'Rincian sesi'}
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
                    {item.lab?.nama ?? item.sesi?.lab ?? 'Lab'}
                  </Text>
                  {item.sesi ? (
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {isEn ? 'Class' : 'Kelas'} {item.sesi.kelas}
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
                      ? isEn
                        ? `Late by ${item.tagihan.menitTerlambat} minutes`
                        : `Terlambat ${item.tagihan.menitTerlambat} menit`
                      : isEn
                        ? 'On time'
                        : 'Tepat waktu'}
                  </Text>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {kehadiranItem
                      ? `${isEn ? 'Checked in at' : 'Dicatat pada'} ${formatJam(kehadiranItem.waktuHadir)}`
                      : isEn
                        ? 'Fine is calculated from your check-in time.'
                        : 'Denda dihitung dari waktu presensimu.'}
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
                {isEn ? 'Transaction history' : 'Riwayat transaksi'}
              </Text>

              {transaksi.length === 0 ? (
                <Text
                  style={[
                    styles.emptyTransaction,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {isEn ? 'No transactions yet.' : 'Belum ada transaksi.'}
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

            <Text style={[styles.meta, { color: themeColors.textMuted }]}>
              {isEn ? 'Recorded' : 'Dicatat'}{' '}
              {formatTanggalTagihan(item.tagihan.dibuatPada, isEn)} ·{' '}
              {formatJam(item.tagihan.dibuatPada)}
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
  meta: {
    ...type.micro,
    textAlign: 'center',
  },
});
