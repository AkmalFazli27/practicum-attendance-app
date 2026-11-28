import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ReceiptText } from 'lucide-react-native';

import { EmptyState, TagihanCard } from '@/components/ui';
import { BannerGalat } from '@/components/praktikan/BannerGalat';
import { formatRupiah } from '@/components/praktikan/formatTagihan';
import { usePembayaranTagihan } from '@/components/praktikan/usePembayaranTagihan';
import { useTagihanPraktikan } from '@/components/praktikan/useTagihanPraktikan';
import { usePreferences } from '@/context/PreferencesContext';
import {
  layout,
  radius,
  shadows,
  spacing,
  type,
} from '@/theme/tokens';

export default function TagihanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const {
    daftar,
    totalTertunggak,
    jumlahAktif,
    loading,
    error,
    retrySync,
  } = useTagihanPraktikan();
  const { bayar, memproses, galat, clearGalat } = usePembayaranTagihan();
  const [idProses, setIdProses] = useState<string | null>(null);

  const bukaDetail = (id: string) =>
    router.push({
      pathname: '/(praktikan)/tagihan/[id]',
      params: { id },
    } as any);

  const handleBayar = async (id: string) => {
    if (memproses || idProses) return;
    setIdProses(id);
    try {
      await bayar(id);
    } finally {
      setIdProses(null);
    }
  };

  const bisaBayar = (status: string) =>
    status === 'UNPAID' || status === 'FAILED';

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
            {isEn ? 'BILLING' : 'TAGIHAN'}
          </Text>
          <Text
            style={[styles.title, { color: themeColors.textPrimary }]}
            numberOfLines={1}
          >
            {isEn ? 'Bills' : 'Tagihan'}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && daftar.length > 0}
            onRefresh={retrySync}
            tintColor={themeColors.textSecondary}
          />
        }
      >
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {isEn
            ? 'Your late-attendance bills'
            : 'Tagihan denda keterlambatanmu'}
        </Text>

        {!error && (!loading || daftar.length > 0) ? (
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View
              style={[
                styles.summaryIconTile,
                { backgroundColor: themeColors.primarySoft },
              ]}
            >
              <ReceiptText size={22} color={themeColors.textPrimary} />
            </View>
            <View style={styles.summaryCopy}>
              <Text
                style={[styles.summaryLabel, { color: themeColors.textSecondary }]}
              >
                {isEn ? 'Total outstanding' : 'Total tertunggak'}
              </Text>
              <Text
                style={[styles.summaryAmount, { color: themeColors.textPrimary }]}
              >
                {formatRupiah(totalTertunggak)}
              </Text>
              <Text style={[styles.summaryNote, { color: themeColors.textMuted }]}>
                {jumlahAktif === 0
                  ? isEn
                    ? 'No active bills'
                    : 'Tidak ada tagihan aktif'
                  : isEn
                    ? `${jumlahAktif} active ${jumlahAktif === 1 ? 'bill' : 'bills'}`
                    : `${jumlahAktif} tagihan aktif`}
              </Text>
            </View>
          </View>
        ) : null}

        {galat ? (
          <BannerGalat pesan={galat} onTutup={clearGalat} />
        ) : null}

        {error ? (
          <EmptyState
            judul={isEn ? 'Failed to load bills' : 'Gagal memuat tagihan'}
            pesan={error}
            aksi={{
              label: isEn ? 'Try again' : 'Coba lagi',
              onPress: retrySync,
            }}
          />
        ) : loading && daftar.length === 0 ? (
          <EmptyState
            judul={isEn ? 'Loading bills…' : 'Memuat tagihan…'}
            pesan={isEn ? 'Please wait a moment.' : 'Mohon tunggu sebentar.'}
          />
        ) : daftar.length === 0 ? (
          <EmptyState
            judul={isEn ? 'No bills yet' : 'Belum ada tagihan'}
            pesan={
              isEn
                ? 'Bills will appear here if you check in late.'
                : 'Tagihan akan muncul jika kamu terlambat presensi.'
            }
          />
        ) : (
          <View style={styles.list}>
            {daftar.map((item) => (
              <TagihanCard
                key={item.tagihan.id}
                tagihan={item.tagihan}
                judul={item.judul}
                subjudul={item.subjudul}
                onPress={() => bukaDetail(item.tagihan.id)}
                onBayar={
                  bisaBayar(item.tagihan.status)
                    ? () => handleBayar(item.tagihan.id)
                    : undefined
                }
                loadingBayar={idProses === item.tagihan.id}
              />
            ))}
          </View>
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
  subtitle: {
    ...type.caption,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s4,
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    ...shadows.card,
  },
  summaryIconTile: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    ...type.micro,
    letterSpacing: 0.4,
  },
  summaryAmount: {
    ...type.h2,
  },
  summaryNote: {
    ...type.micro,
  },
  list: {
    gap: spacing.s3,
  },
});
