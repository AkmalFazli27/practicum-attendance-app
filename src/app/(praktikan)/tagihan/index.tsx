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
import { useTranslation } from 'react-i18next';
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
  const { themeColors } = usePreferences();
  const { t } = useTranslation();
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
            {t('tagihan.title')}
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
          {t('tagihan.subtitle')}
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
                {t('tagihan.totalOutstanding')}
              </Text>
              <Text
                style={[styles.summaryAmount, { color: themeColors.textPrimary }]}
              >
                {formatRupiah(totalTertunggak)}
              </Text>
              <Text style={[styles.summaryNote, { color: themeColors.textMuted }]}>
                {jumlahAktif === 0
                  ? t('tagihan.noActiveBills')
                  : t('tagihan.activeBills', { count: jumlahAktif })}
              </Text>
            </View>
          </View>
        ) : null}

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
        ) : loading && daftar.length === 0 ? (
          <EmptyState
            judul={t('tagihan.loadingTitle')}
            pesan={t('common.pleaseWait')}
          />
        ) : daftar.length === 0 ? (
          <EmptyState
            judul={t('tagihan.emptyTitle')}
            pesan={t('tagihan.emptyBody')}
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
    width: 44,
    height: 44,
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
    width: 44,
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
