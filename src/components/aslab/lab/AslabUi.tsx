import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlertTriangle, Check, CheckCircle2, ChevronDown } from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
import {
  fontFamily,
  radius,
  spacing,
  type as tipe,
  type ThemeColors,
} from '@/theme/tokens';

export interface DropdownOption {
  label: string;
  value: string;
  subtitle?: string;
}

export interface DropdownSelectProps {
  label: string;
  value: string;
  placeholder?: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

/**
 * Komponen Dropdown reusable untuk area Aslab (pemilihan hari, ruangan lab, mata kuliah, kelas).
 * Membuka daftar pilihan rapi di tengah layar agar tidak tertutup sheet bawah.
 */
export function DropdownSelect({
  label,
  value,
  placeholder = 'Pilih…',
  options,
  onSelect,
  disabled = false,
}: DropdownSelectProps) {
  const { themeColors: tc, language } = usePreferences();
  const isEn = language === 'en';
  const s = useMemo(() => buatGaya(tc), [tc]);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          s.dropdownTrigger,
          disabled && { opacity: 0.55 },
          pressed && s.pressed,
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              s.dropdownValue,
              !selected && { color: tc.textMuted, fontFamily: fontFamily.regular },
            ]}
            numberOfLines={1}
          >
            {selected ? selected.label : placeholder}
          </Text>
          {selected?.subtitle ? (
            <Text style={s.dropdownSub} numberOfLines={1}>
              {selected.subtitle}
            </Text>
          ) : null}
        </View>
        <ChevronDown size={18} color={tc.textSecondary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={s.centerBackdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={s.dropdownDialog}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={s.dialogTitle}>{label}</Text>
            <ScrollView
              style={s.optionsScroll}
              showsVerticalScrollIndicator={false}
            >
              {options.map((opt) => {
                const aktif = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    accessibilityRole="button"
                    onPress={() => {
                      onSelect(opt.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      s.optionRow,
                      aktif && s.optionRowActive,
                      pressed && s.pressed,
                    ]}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={[
                          s.optionLabel,
                          aktif && s.optionLabelActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {opt.subtitle ? (
                        <Text style={s.optionSub}>{opt.subtitle}</Text>
                      ) : null}
                    </View>
                    {aktif ? (
                      <View style={s.checkBadge}>
                        <Check size={13} color={tc.onPrimary} strokeWidth={3} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={({ pressed }) => [s.closeBtn, pressed && s.pressed]}
            >
              <Text style={s.closeBtnText}>{isEn ? 'Close' : 'Tutup'}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export interface ConfirmDialogModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'confirm' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Dialog konfirmasi reusable yang selalu tampil tepat di TENGAH layar
 * (dipakai untuk konfirmasi Hapus maupun konfirmasi Simpan Perubahan / Edit).
 */
export function ConfirmDialogModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'confirm',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogModalProps) {
  const { themeColors: tc, language } = usePreferences();
  const isEn = language === 'en';
  const s = useMemo(() => buatGaya(tc), [tc]);

  const isDanger = tone === 'danger';
  const labelYa =
    confirmLabel ??
    (isDanger
      ? isEn
        ? 'Yes, Delete'
        : 'Ya, Hapus'
      : isEn
        ? 'Yes, Save'
        : 'Ya, Ubah');
  const labelBatal = cancelLabel ?? (isEn ? 'Cancel' : 'Batal');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!loading) onCancel();
      }}
    >
      <Pressable
        style={s.centerBackdrop}
        onPress={() => {
          if (!loading) onCancel();
        }}
      >
        <Pressable
          style={s.confirmCard}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              s.confirmIconWrap,
              isDanger ? s.confirmIconDanger : s.confirmIconPrimary,
            ]}
          >
            {isDanger ? (
              <AlertTriangle size={22} color={tc.errorFg} />
            ) : (
              <CheckCircle2 size={22} color={tc.sesiDibukaFg} />
            )}
          </View>

          <Text style={s.confirmTitle}>{title}</Text>
          <Text style={s.confirmMessage}>{message}</Text>

          <View style={s.confirmBtnRow}>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={onCancel}
              style={({ pressed }) => [s.cancelBtn, pressed && s.pressed]}
            >
              <Text style={s.cancelBtnText}>{labelBatal}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={onConfirm}
              style={({ pressed }) => [
                s.confirmBtn,
                isDanger ? s.confirmBtnDanger : s.confirmBtnPrimary,
                loading && { opacity: 0.55 },
                pressed && s.pressed,
              ]}
            >
              <Text
                style={[
                  s.confirmBtnText,
                  isDanger ? { color: '#FFFFFF' } : { color: tc.onPrimary },
                ]}
              >
                {loading ? (isEn ? 'Processing…' : 'Memproses…') : labelYa}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    fieldWrap: {
      gap: 6,
    },
    fieldLabel: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
      marginLeft: 4,
    },
    dropdownTrigger: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      paddingHorizontal: 15,
      paddingVertical: 9,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    dropdownValue: {
      fontSize: 14,
      fontFamily: fontFamily.semibold,
      color: w.textPrimary,
    },
    dropdownSub: {
      fontSize: 11.5,
      fontFamily: fontFamily.regular,
      color: w.textMuted,
      marginTop: 1,
    },
    centerBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.s5,
    },
    dropdownDialog: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: w.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: w.border,
      padding: 20,
      gap: 12,
    },
    dialogTitle: {
      fontSize: 16,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
      textAlign: 'center',
    },
    optionsScroll: {
      maxHeight: 290,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderBottomWidth: 1,
      borderBottomColor: w.border,
    },
    optionRowActive: {
      backgroundColor: w.sesiDibukaBg,
    },
    optionLabel: {
      fontSize: 14,
      fontFamily: fontFamily.medium,
      color: w.textPrimary,
    },
    optionLabelActive: {
      fontFamily: fontFamily.bold,
      color: w.sesiDibukaFg,
    },
    optionSub: {
      fontSize: 11.5,
      color: w.textMuted,
    },
    checkBadge: {
      width: 22,
      height: 22,
      borderRadius: radius.pill,
      backgroundColor: w.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtn: {
      height: 46,
      borderRadius: radius.pill,
      backgroundColor: w.surfaceMuted,
      borderWidth: 1,
      borderColor: w.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    closeBtnText: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    // Confirm Dialog (Centered)
    confirmCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: w.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: w.border,
      paddingHorizontal: 22,
      paddingVertical: 24,
      alignItems: 'center',
      gap: 12,
    },
    confirmIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    confirmIconPrimary: {
      backgroundColor: w.sesiDibukaBg,
    },
    confirmIconDanger: {
      backgroundColor: w.errorBg,
    },
    confirmTitle: {
      ...tipe.h2,
      fontSize: 18,
      color: w.textPrimary,
      textAlign: 'center',
    },
    confirmMessage: {
      ...tipe.body,
      fontSize: 13.5,
      lineHeight: 20,
      color: w.textSecondary,
      textAlign: 'center',
    },
    confirmBtnRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginTop: 8,
    },
    cancelBtn: {
      flex: 1,
      height: 46,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      fontSize: 13.5,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    confirmBtn: {
      flex: 1.2,
      height: 46,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnPrimary: {
      backgroundColor: w.primary,
    },
    confirmBtnDanger: {
      backgroundColor: w.errorFg,
    },
    confirmBtnText: {
      fontSize: 13.5,
      fontFamily: fontFamily.bold,
    },
    pressed: {
      opacity: 0.8,
    },
  });
