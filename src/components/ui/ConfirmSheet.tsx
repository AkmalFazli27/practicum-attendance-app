import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, CheckCircle2, LockKeyhole } from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { SheetModal } from './SheetModal';
import { Tombol } from './Tombol';

export interface ConfirmSummaryItem {
  label: string;
  value: string;
}

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  body: string;
  icon?: React.ReactNode;
  summary?: ConfirmSummaryItem[];
  requireDeclaration?: boolean;
  declarationLabel?: string;
  loading?: boolean;
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmSheet({
  visible,
  title,
  body,
  icon,
  summary = [],
  requireDeclaration = false,
  declarationLabel = 'Saya menyatakan hadir pada sesi ini.',
  loading = false,
  danger = false,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const [checked, setChecked] = useState(false);

  const labelBatal = cancelLabel ?? (isEn ? 'Cancel' : 'Batal');
  const labelKonfirm =
    confirmLabel ?? (isEn ? 'Yes, continue' : 'Ya, lanjutkan');

  useEffect(() => {
    if (visible) {
      setChecked(false);
    }
  }, [visible]);

  const canConfirm = !requireDeclaration || checked;

  return (
    <SheetModal
      visible={visible}
      hideHeader
      dismissible={!loading}
      onClose={onClose}
      footer={
        <View style={styles.actionsRow}>
          <Tombol
            variant="sekunder"
            disabled={loading}
            onPress={onClose}
            style={styles.cancelBtn}
          >
            {labelBatal}
          </Tombol>
          <Tombol
            variant={danger ? 'danger' : 'primer'}
            disabled={!canConfirm}
            loading={loading}
            onPress={onConfirm}
            style={styles.confirmBtn}
          >
            {loading ? (isEn ? 'Processing' : 'Memproses') : labelKonfirm}
          </Tombol>
        </View>
      }
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: danger
              ? themeColors.errorBg
              : themeColors.primary,
          },
        ]}
      >
        {icon ??
          (danger ? (
            <LockKeyhole size={27} color={themeColors.errorFg} />
          ) : (
            <CheckCircle2 size={28} color={themeColors.onPrimary} />
          ))}
      </View>

      <View style={styles.copyGroup}>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.body, { color: themeColors.textSecondary }]}>
          {body}
        </Text>
      </View>

      {summary.length > 0 && (
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          {summary.map((item, idx) => (
            <View
              key={`${item.label}-${idx}`}
              style={[
                styles.summaryRow,
                idx > 0 && {
                  borderTopWidth: 1,
                  borderTopColor: themeColors.border,
                },
              ]}
            >
              <Text
                style={[styles.summaryLabel, { color: themeColors.textMuted }]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: themeColors.textPrimary },
                ]}
                numberOfLines={2}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {requireDeclaration && (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked, disabled: loading }}
          disabled={loading}
          onPress={() => setChecked((prev) => !prev)}
          style={styles.declarationRow}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: checked
                  ? themeColors.primary
                  : themeColors.borderDashed,
                backgroundColor: checked
                  ? themeColors.primary
                  : themeColors.surface,
              },
            ]}
          >
            {checked && <Check size={14} color={themeColors.onPrimary} />}
          </View>
          <Text
            style={[
              styles.declarationText,
              { color: themeColors.textPrimary },
            ]}
          >
            {declarationLabel}
          </Text>
        </Pressable>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxPrimary: {
    backgroundColor: colors.primary,
  },
  iconBoxDanger: {
    backgroundColor: colors.errorBg,
  },
  copyGroup: {
    marginTop: spacing.s2,
    alignItems: 'center',
    gap: spacing.s2,
  },
  title: {
    ...type.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 315,
    lineHeight: 18,
  },
  summaryCard: {
    marginTop: spacing.s2,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s4,
  },
  summaryRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s3,
    paddingVertical: spacing.s2,
  },
  summaryRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    ...type.caption,
    color: colors.textMuted,
  },
  summaryValue: {
    ...type.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2 + 2,
    marginTop: spacing.s2,
    paddingVertical: spacing.s1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  declarationText: {
    ...type.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.s2 + 2,
    paddingBottom: spacing.s2,
  },
  cancelBtn: {
    flex: 0.85,
  },
  confirmBtn: {
    flex: 1.15,
  },
});

