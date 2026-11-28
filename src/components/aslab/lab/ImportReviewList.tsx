import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  UserX,
  X,
} from 'lucide-react-native';

import { EmptyState, Tombol } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import type { HasilBulk } from '@/data/dummy';
import {
  fontFamily,
  radius,
  spacing,
  type,
  type ThemeColors,
} from '@/theme/tokens';
import { useLabI18n } from './i18nLab';
import type { StatusBarisReview } from './validasiManajemenLab';

export interface FieldDefinisiReview<K extends string = string> {
  key: K;
  label: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
}

export interface ItemReviewTampil<K extends string = string> {
  id: string;
  nomorBaris: number;
  diterima: boolean;
  status: StatusBarisReview;
  judulUtama: string;
  subjudul?: string;
  pesanMasalah?: string;
  nilaiField: Record<K, string>;
}

export interface ImportReviewListProps<K extends string = string> {
  items: ItemReviewTampil<K>[];
  fields: FieldDefinisiReview<K>[];
  onToggleTerima: (id: string) => void;
  onTerimaSemuaValid: () => void;
  onTolakSemua: () => void;
  onUbahField: (id: string, key: K, nilai: string) => void;
  onSimpan: () => void;
  menyimpan?: boolean;
  hasilSimpan?: HasilBulk | null;
}

/**
 * Daftar review baris CSV untuk ketiga Bulk Insert (Lab, Praktikan, Asprak).
 * Setiap baris dapat diterima/ditolak, dilengkapi/diubah inline, dan memiliki
 * indikator status (Valid, Tidak Valid, Duplikat, Belum Terdaftar).
 * Hanya baris yang diterima DAN berstatus Valid yang akan diproses saat Simpan.
 */
export function ImportReviewList<K extends string = string>({
  items,
  fields,
  onToggleTerima,
  onTerimaSemuaValid,
  onTolakSemua,
  onUbahField,
  onSimpan,
  menyimpan = false,
  hasilSimpan = null,
}: ImportReviewListProps<K>) {
  const { themeColors } = usePreferences();
  const { t } = useLabI18n();
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);
  const [sedangDieditId, setSedangDieditId] = useState<string | null>(null);

  const ringkasan = useMemo(() => {
    let valid = 0;
    let invalid = 0;
    let duplikat = 0;
    let belumTerdaftar = 0;
    let diterimaValid = 0;
    for (const item of items) {
      if (item.status === 'valid') {
        valid += 1;
        if (item.diterima) diterimaValid += 1;
      } else if (item.status === 'invalid') {
        invalid += 1;
      } else if (item.status === 'duplikat') {
        duplikat += 1;
      } else if (item.status === 'belum-terdaftar') {
        belumTerdaftar += 1;
      }
    }
    return {
      total: items.length,
      valid,
      invalid,
      duplikat,
      belumTerdaftar,
      diterimaValid,
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <EmptyState
        judul={t('reviewEmptyTitle')}
        pesan={t('reviewEmptyDesc')}
      />
    );
  }

  const getStatusBadge = (status: StatusBarisReview) => {
    switch (status) {
      case 'valid':
        return {
          label: t('badgeValid'),
          bg: themeColors.sesiDibukaBg,
          fg: themeColors.sesiDibukaFg,
          Icon: CheckCircle2,
        };
      case 'duplikat':
        return {
          label: t('badgeDuplicate'),
          bg: themeColors.gpsOffBg,
          fg: themeColors.gpsOffFg,
          Icon: Copy,
        };
      case 'belum-terdaftar':
        return {
          label: t('badgeUnregistered'),
          bg: themeColors.izinBg,
          fg: themeColors.izinFg,
          Icon: UserX,
        };
      case 'invalid':
      default:
        return {
          label: t('badgeInvalid'),
          bg: themeColors.errorBg,
          fg: themeColors.errorFg,
          Icon: AlertTriangle,
        };
    }
  };

  return (
    <View style={styles.container}>
      {/* Ringkasan Jumlah */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryChipWrap}>
          <View
            style={[
              styles.summaryChip,
              { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <Text
              style={[styles.summaryChipText, { color: themeColors.textPrimary }]}
            >
              {t('sumTotal', { count: ringkasan.total })}
            </Text>
          </View>
          <View
            style={[
              styles.summaryChip,
              { backgroundColor: themeColors.sesiDibukaBg },
            ]}
          >
            <Text
              style={[
                styles.summaryChipText,
                { color: themeColors.sesiDibukaFg },
              ]}
            >
              {t('sumValid', { count: ringkasan.valid })}
            </Text>
          </View>
          {ringkasan.invalid > 0 ? (
            <View
              style={[
                styles.summaryChip,
                { backgroundColor: themeColors.errorBg },
              ]}
            >
              <Text
                style={[styles.summaryChipText, { color: themeColors.errorFg }]}
              >
                {t('sumInvalid', { count: ringkasan.invalid })}
              </Text>
            </View>
          ) : null}
          {ringkasan.duplikat > 0 ? (
            <View
              style={[
                styles.summaryChip,
                { backgroundColor: themeColors.gpsOffBg },
              ]}
            >
              <Text
                style={[
                  styles.summaryChipText,
                  { color: themeColors.gpsOffFg },
                ]}
              >
                {t('sumDuplicate', { count: ringkasan.duplikat })}
              </Text>
            </View>
          ) : null}
          {ringkasan.belumTerdaftar > 0 ? (
            <View
              style={[
                styles.summaryChip,
                { backgroundColor: themeColors.izinBg },
              ]}
            >
              <Text
                style={[styles.summaryChipText, { color: themeColors.izinFg }]}
              >
                {t('sumUnregistered', { count: ringkasan.belumTerdaftar })}
              </Text>
            </View>
          ) : null}
          <View
            style={[
              styles.summaryChip,
              { backgroundColor: themeColors.primarySoft },
            ]}
          >
            <Text
              style={[styles.summaryChipText, { color: themeColors.textPrimary }]}
            >
              {t('sumAccepted', { count: ringkasan.diterimaValid })}
            </Text>
          </View>
        </View>

        <View style={styles.bulkQuickRow}>
          <Pressable
            accessibilityRole="button"
            disabled={menyimpan || ringkasan.valid === 0}
            onPress={onTerimaSemuaValid}
            style={({ pressed }) => [
              styles.smallBtn,
              pressed && styles.smallBtnPressed,
              (menyimpan || ringkasan.valid === 0) && styles.smallBtnDisabled,
            ]}
          >
            <Check size={14} color={themeColors.textPrimary} />
            <Text style={styles.smallBtnText}>{t('acceptAllValid')}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={menyimpan}
            onPress={onTolakSemua}
            style={({ pressed }) => [
              styles.smallBtn,
              pressed && styles.smallBtnPressed,
              menyimpan && styles.smallBtnDisabled,
            ]}
          >
            <X size={14} color={themeColors.textSecondary} />
            <Text style={styles.smallBtnText}>{t('rejectAll')}</Text>
          </Pressable>
        </View>

        {ringkasan.belumTerdaftar > 0 || ringkasan.duplikat > 0 ? (
          <Text style={styles.noteText}>{t('unregisteredNote')}</Text>
        ) : null}
      </View>

      {/* Hasil Simpan per Baris (bila sudah pernah klik Simpan) */}
      {hasilSimpan ? (
        <View
          style={[
            styles.resultCard,
            {
              borderColor:
                hasilSimpan.gagal.length > 0
                  ? themeColors.gpsOffBorder
                  : themeColors.radiusInsideBorder,
              backgroundColor:
                hasilSimpan.gagal.length > 0
                  ? themeColors.gpsOffBg
                  : themeColors.radiusInsideBg,
            },
          ]}
        >
          <Text
            style={[
              styles.resultTitle,
              {
                color:
                  hasilSimpan.gagal.length > 0
                    ? themeColors.gpsOffFg
                    : themeColors.radiusInsideFg,
              },
            ]}
          >
            {t('resultTitle')}
          </Text>
          <Text style={styles.resultSuccess}>
            {t('resultSuccessCount', { count: hasilSimpan.berhasil })}
          </Text>
          {hasilSimpan.gagal.length > 0 ? (
            <View style={styles.failList}>
              <Text style={styles.resultFailHeader}>
                {t('resultFailCount', { count: hasilSimpan.gagal.length })}
              </Text>
              {hasilSimpan.gagal.map((g, idx) => (
                <Text key={`${g.baris}-${idx}`} style={styles.resultFailItem}>
                  • {t('resultRowReason', { baris: g.baris, alasan: g.alasan })}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Daftar Baris CSV */}
      <View style={styles.rowsWrap}>
        {items.map((item) => {
          const badge = getStatusBadge(item.status);
          const BadgeIcon = badge.Icon;
          const sedangEdit = sedangDieditId === item.id;
          const bisaDiterima = item.status === 'valid';
          const aktifDiterima = item.diterima && bisaDiterima;

          return (
            <View
              key={item.id}
              style={[
                styles.rowCard,
                aktifDiterima && styles.rowCardAccepted,
                !aktifDiterima && styles.rowCardRejected,
              ]}
            >
              <View style={styles.rowTop}>
                <Text style={styles.rowNumText}>
                  {t('rowNumber', { num: item.nomorBaris })}
                </Text>
                <View
                  style={[styles.statusBadge, { backgroundColor: badge.bg }]}
                  accessibilityRole="text"
                  accessibilityLabel={badge.label}
                >
                  <BadgeIcon size={12} color={badge.fg} />
                  <Text style={[styles.statusBadgeText, { color: badge.fg }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.rowTitle}>{item.judulUtama || '—'}</Text>
              {item.subjudul ? (
                <Text style={styles.rowSubtitle}>{item.subjudul}</Text>
              ) : null}

              {item.pesanMasalah ? (
                <Text style={styles.rowProblemText}>{item.pesanMasalah}</Text>
              ) : null}

              {/* Form Edit Inline untuk melengkapi / mengubah baris */}
              {sedangEdit ? (
                <View style={styles.editSection}>
                  {fields.map((f) => (
                    <View key={f.key} style={styles.editFieldGroup}>
                      <Text style={styles.editLabel}>{f.label}</Text>
                      <TextInput
                        value={item.nilaiField[f.key] ?? ''}
                        onChangeText={(txt) => onUbahField(item.id, f.key, txt)}
                        placeholder={f.placeholder}
                        placeholderTextColor={themeColors.textMuted}
                        keyboardType={f.keyboardType ?? 'default'}
                        autoCapitalize={
                          f.keyboardType === 'email-address' ? 'none' : 'sentences'
                        }
                        editable={!menyimpan}
                        style={styles.editInput}
                      />
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Baris Aksi: Terima/Tolak + Ubah */}
              <View style={styles.rowActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={!bisaDiterima || menyimpan}
                  onPress={() => onToggleTerima(item.id)}
                  style={({ pressed }) => [
                    styles.toggleBtn,
                    aktifDiterima
                      ? styles.toggleBtnAccept
                      : styles.toggleBtnReject,
                    (!bisaDiterima || menyimpan) && styles.smallBtnDisabled,
                    pressed && styles.smallBtnPressed,
                  ]}
                >
                  {aktifDiterima ? (
                    <Check size={14} color={themeColors.onPrimary} />
                  ) : (
                    <X size={14} color={themeColors.textSecondary} />
                  )}
                  <Text
                    style={[
                      styles.toggleBtnText,
                      {
                        color: aktifDiterima
                          ? themeColors.onPrimary
                          : themeColors.textSecondary,
                      },
                    ]}
                  >
                    {aktifDiterima ? t('acceptRow') : t('rejectRow')}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={menyimpan}
                  onPress={() =>
                    setSedangDieditId(sedangEdit ? null : item.id)
                  }
                  style={({ pressed }) => [
                    styles.editBtn,
                    pressed && styles.smallBtnPressed,
                  ]}
                >
                  <Edit3 size={14} color={themeColors.textPrimary} />
                  <Text style={styles.editBtnText}>
                    {sedangEdit ? t('doneEditRow') : t('editRow')}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      {/* Tombol Simpan Baris Terpilih & Valid */}
      <View style={styles.saveSection}>
        {ringkasan.diterimaValid === 0 ? (
          <Text style={styles.noValidHint}>{t('noValidAcceptedHint')}</Text>
        ) : null}
        <Tombol
          variant="primer"
          loading={menyimpan}
          disabled={ringkasan.diterimaValid === 0 || menyimpan}
          onPress={onSimpan}
        >
          {t('saveAcceptedBtn', { count: ringkasan.diterimaValid })}
        </Tombol>
      </View>
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: spacing.s3,
    },
    summaryCard: {
      padding: spacing.s3 + 2,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      gap: spacing.s3,
    },
    summaryChipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    summaryChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
    },
    summaryChipText: {
      ...type.micro,
      fontFamily: fontFamily.bold,
    },
    bulkQuickRow: {
      flexDirection: 'row',
      gap: spacing.s2,
    },
    smallBtn: {
      flex: 1,
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.background,
    },
    smallBtnPressed: {
      opacity: 0.75,
    },
    smallBtnDisabled: {
      opacity: 0.45,
    },
    smallBtnText: {
      ...type.micro,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    noteText: {
      ...type.micro,
      color: w.textMuted,
      lineHeight: 16,
    },
    resultCard: {
      padding: spacing.s3 + 2,
      borderRadius: radius.card,
      borderWidth: 1,
      gap: 6,
    },
    resultTitle: {
      ...type.bodyStrong,
      fontFamily: fontFamily.bold,
    },
    resultSuccess: {
      ...type.caption,
      fontFamily: fontFamily.semibold,
      color: w.textPrimary,
    },
    failList: {
      marginTop: 4,
      gap: 3,
    },
    resultFailHeader: {
      ...type.caption,
      fontFamily: fontFamily.bold,
      color: w.errorFg,
    },
    resultFailItem: {
      ...type.micro,
      color: w.errorFg,
      lineHeight: 16,
    },
    rowsWrap: {
      gap: spacing.s2 + 2,
    },
    rowCard: {
      padding: spacing.s3 + 2,
      borderRadius: radius.card,
      borderWidth: 1,
      backgroundColor: w.surface,
      gap: spacing.s2,
    },
    rowCardAccepted: {
      borderColor: w.primaryPressed,
    },
    rowCardRejected: {
      borderColor: w.border,
      opacity: 0.88,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s2,
    },
    rowNumText: {
      ...type.micro,
      fontFamily: fontFamily.bold,
      color: w.textMuted,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    statusBadgeText: {
      fontSize: 11,
      fontFamily: fontFamily.bold,
    },
    rowTitle: {
      ...type.bodyStrong,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    rowSubtitle: {
      ...type.caption,
      color: w.textSecondary,
    },
    rowProblemText: {
      ...type.micro,
      fontFamily: fontFamily.semibold,
      color: w.errorFg,
      lineHeight: 16,
    },
    editSection: {
      gap: spacing.s2,
      paddingTop: spacing.s2,
      borderTopWidth: 1,
      borderTopColor: w.border,
    },
    editFieldGroup: {
      gap: 4,
    },
    editLabel: {
      ...type.micro,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    editInput: {
      minHeight: 40,
      paddingHorizontal: spacing.s3,
      paddingVertical: 8,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.background,
      ...type.caption,
      color: w.textPrimary,
    },
    rowActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
      paddingTop: 4,
    },
    toggleBtn: {
      flex: 1,
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
    },
    toggleBtnAccept: {
      backgroundColor: w.primary,
      borderColor: w.primaryPressed,
    },
    toggleBtnReject: {
      backgroundColor: w.background,
      borderColor: w.border,
    },
    toggleBtnText: {
      ...type.micro,
      fontFamily: fontFamily.bold,
    },
    editBtn: {
      flex: 1,
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.background,
    },
    editBtnText: {
      ...type.micro,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    saveSection: {
      marginTop: spacing.s2,
      gap: spacing.s2,
    },
    noValidHint: {
      ...type.caption,
      color: w.textMuted,
      textAlign: 'center',
    },
  });
