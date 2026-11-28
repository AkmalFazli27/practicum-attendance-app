import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

export function LoadingBlock({ pesan }: { pesan?: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center} accessibilityRole="progressbar">
      <ActivityIndicator size="small" color={colors.graphite} />
      <Text style={styles.centerText}>{pesan ?? t('asprak.syncLoading')}</Text>
    </View>
  );
}

export function ErrorBlock({
  pesan,
  onRetry,
}: {
  pesan: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.errorCard} accessibilityRole="alert">
      <View style={styles.errorIcon}>
        <AlertTriangle size={22} color={colors.errorFg} />
      </View>
      <Text style={styles.errorTitle}>{t('asprak.syncErrorTitle')}</Text>
      <Text style={styles.errorBody}>{pesan}</Text>
      <Tombol variant="sekunder" onPress={onRetry}>
        {t('common.retry')}
      </Tombol>
    </View>
  );
}

/**
 * Pembungkus status sinkronisasi Firestore untuk daftar milik asisten.
 * - loading & belum ada data  -> indikator memuat
 * - error & belum ada data    -> kartu error dengan tombol "Coba lagi"
 * - error & sudah ada data    -> banner kecil di atas konten (data lama tetap tampil)
 */
export function SinkronGuard({
  adaData,
  children,
}: {
  adaData: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { loading, error, retrySync, clearError } = useSession();

  if (loading && !adaData) return <LoadingBlock />;
  if (error && !adaData) return <ErrorBlock pesan={error} onRetry={retrySync} />;

  return (
    <>
      {error ? (
        <View style={styles.banner} accessibilityRole="alert">
          <AlertTriangle size={16} color={colors.errorFg} />
          <Text style={styles.bannerText} numberOfLines={3}>
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={retrySync}
            hitSlop={8}
          >
            <Text style={styles.bannerAksi}>{t('common.retry')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('asprak.syncCloseErrorAria')}
            onPress={clearError}
            hitSlop={8}
          >
            <X size={16} color={colors.errorFg} />
          </Pressable>
        </View>
      ) : null}
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: spacing.s8,
    alignItems: 'center',
    gap: spacing.s3,
  },
  centerText: {
    ...type.caption,
    color: colors.textMuted,
  },
  errorCard: {
    alignItems: 'center',
    gap: spacing.s2,
    padding: spacing.s5,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.errorBg,
  },
  errorIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    ...type.bodyStrong,
    color: colors.errorFg,
    textAlign: 'center',
  },
  errorBody: {
    ...type.caption,
    color: colors.errorFg,
    textAlign: 'center',
    marginBottom: spacing.s2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    padding: spacing.s3,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.errorBg,
    marginBottom: spacing.s3,
  },
  bannerText: {
    ...type.caption,
    flex: 1,
    color: colors.errorFg,
  },
  bannerAksi: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.errorFg,
    textDecorationLine: 'underline',
  },
});
