import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { SheetModal, Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { formatLabelKategoriAi, KATEGORI_IZIN_RESMI } from '@/services/ai';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, titikJam } from '@/utils/format';

export interface IzinSheetProps {
  sesi: Sesi | null;
  onClose: () => void;
}

export function IzinSheet({ sesi, onClose }: IzinSheetProps) {
  const {
    currentUser,
    submitIzin,
    getIzinBySesiPraktikan,
    getStatusEfektif,
  } = useSession();
  const { showToast } = useToast();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';

  const [alasan, setAlasan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);

  const visible = sesi !== null;

  useEffect(() => {
    if (visible) {
      setAlasan('');
      setGalat(null);
      setMengirim(false);
    }
  }, [visible]);

  const handleKirim = async () => {
    if (!sesi || mengirim) return;
    if (getStatusEfektif(sesi) === 'SELESAI') {
      setGalat(
        isEn
          ? 'Cannot submit a leave request because this session has ended.'
          : 'Tidak dapat mengajukan izin karena waktu sesi telah selesai.',
      );
      return;
    }
    if (alasan.trim().length < 10) {
      setGalat(
        isEn
          ? 'Please enter a leave reason of at least 10 characters.'
          : 'Tuliskan alasan ketidakhadiran minimal 10 karakter.',
      );
      return;
    }
    if (currentUser && getIzinBySesiPraktikan(sesi.id, currentUser.id)) {
      setGalat(
        isEn
          ? 'You have already submitted a leave request for this session.'
          : 'Kamu sudah mengajukan izin untuk sesi ini.',
      );
      return;
    }

    setGalat(null);
    setMengirim(true);

    try {
      const hasil = await submitIzin(sesi.id, alasan);
      setMengirim(false);
      if (!hasil.ok) {
        setGalat(hasil.alasan);
        return;
      }
      onClose();

      const infoAi = formatLabelKategoriAi(
        hasil.izin.kategoriAi,
        hasil.izin.ringkasanAi,
        isEn,
      );
      showToast(
        isEn
          ? `Leave submitted (AI Label: ${infoAi.label}). Waiting for assistant review.`
          : `Izin diajukan (Label AI: ${infoAi.label}). Menunggu pemeriksaan asisten.`,
      );
    } catch (e: any) {
      setMengirim(false);
      setGalat(
        e?.message ||
          (isEn
            ? 'Failed to submit leave request. Check your connection.'
            : 'Gagal mengirimkan pengajuan izin. Periksa koneksimu.'),
      );
    }
  };

  return (
    <SheetModal
      visible={visible}
      kicker={isEn ? 'LEAVE REQUEST' : 'PENGAJUAN IZIN'}
      judul={isEn ? 'Request Practicum Leave' : 'Ajukan Izin Praktikum'}
      dismissible={!mengirim}
      onClose={onClose}
      footer={
        <View style={styles.footerRow}>
          <Tombol
            variant="sekunder"
            disabled={mengirim}
            onPress={onClose}
            style={styles.cancelBtn}
          >
            {isEn ? 'Cancel' : 'Batal'}
          </Tombol>
          <Tombol
            variant="primer"
            loading={mengirim}
            disabled={alasan.trim().length < 10}
            onPress={handleKirim}
            style={styles.submitBtn}
          >
            {mengirim
              ? isEn
                ? 'Analyzing & Sending...'
                : 'Menganalisis & Mengirim...'
              : isEn
                ? 'Submit Request'
                : 'Kirim Pengajuan'}
          </Tombol>
        </View>
      }
    >
      {sesi && (
        <>
          <View
            style={[
              styles.summaryBox,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: themeColors.textMuted }]}
              >
                {isEn ? 'Practicum' : 'Praktikum'}
              </Text>
              <Text
                style={[styles.summaryVal, { color: themeColors.textPrimary }]}
              >
                {sesi.namaPraktikum}
              </Text>
            </View>
            <View
              style={[
                styles.summaryRow,
                styles.summaryRowBorder,
                { borderTopColor: themeColors.border },
              ]}
            >
              <Text
                style={[styles.summaryLabel, { color: themeColors.textMuted }]}
              >
                {isEn ? 'Schedule' : 'Jadwal'}
              </Text>
              <Text
                style={[styles.summaryVal, { color: themeColors.textPrimary }]}
              >
                {formatHariTanggalSingkat(sesi.tanggal)} ·{' '}
                {titikJam(sesi.jamMulai)}
              </Text>
            </View>
            <View
              style={[
                styles.summaryRow,
                styles.summaryRowBorder,
                { borderTopColor: themeColors.border },
              ]}
            >
              <Text
                style={[styles.summaryLabel, { color: themeColors.textMuted }]}
              >
                {isEn ? 'Student' : 'Praktikan'}
              </Text>
              <Text
                style={[styles.summaryVal, { color: themeColors.textPrimary }]}
              >
                {currentUser?.nama ?? '-'}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: themeColors.textPrimary }]}>
              {isEn ? 'Reason for absence' : 'Alasan ketidakhadiran'}
            </Text>
            <TextInput
              value={alasan}
              onChangeText={(txt) => {
                setAlasan(txt);
                if (galat) setGalat(null);
              }}
              placeholder={
                isEn
                  ? 'Explain why you cannot attend (e.g., fever and medical rest, or campus competition)...'
                  : 'Jelaskan alasan kamu berhalangan hadir (misal: sakit demam dan istirahat medis, atau delegasi lomba kampus)...'
              }
              placeholderTextColor={themeColors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!mengirim}
              style={[
                styles.textArea,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.surface,
                  color: themeColors.textPrimary,
                },
              ]}
            />
          </View>

          {/* Informasi Kategori Klasifikasi AI (PB-02) */}
          <View
            style={[
              styles.aiNotice,
              {
                backgroundColor: themeColors.primarySoft,
                borderColor: themeColors.radiusInsideBorder,
              },
            ]}
          >
            <View style={styles.aiHeaderRow}>
              <Sparkles size={15} color={themeColors.sesiDibukaFg} />
              <Text
                style={[
                  styles.aiNoticeTitle,
                  { color: themeColors.sesiDibukaFg },
                ]}
              >
                {isEn
                  ? 'Automatic AI Classification'
                  : 'Klasifikasi Otomatis Model AI'}
              </Text>
            </View>
            <Text
              style={[
                styles.aiNoticeText,
                { color: themeColors.textPrimary },
              ]}
            >
              {isEn
                ? 'Your reason will be automatically labeled into one of the following categories as a reference for the assistant (final decision is made by the assistant):'
                : 'Alasanmu akan diklasifikasikan ke salah satu kategori berikut sebagai referensi pendukung bagi asisten (keputusan akhir tetap oleh asisten):'}
            </Text>
            <View style={styles.categoryChipWrap}>
              {KATEGORI_IZIN_RESMI.map((kat) => (
                <View
                  key={kat}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: themeColors.textPrimary },
                    ]}
                  >
                    {isEn ? (kat === 'Sakit' ? 'Sick' : 'Excused Leave') : kat}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {galat && (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: themeColors.errorBg,
                  borderColor: themeColors.dangerBorder,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: themeColors.errorFg }]}>
                {galat}
              </Text>
            </View>
          )}
        </>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  summaryBox: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s4,
  },
  summaryRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s3,
  },
  summaryRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  summaryLabel: { ...type.caption, color: colors.textMuted },
  summaryVal: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  fieldGroup: { gap: 6, marginTop: spacing.s1 },
  label: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 104,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    ...type.body,
    color: colors.textPrimary,
  },
  aiNotice: {
    gap: 6,
    padding: spacing.s3,
    borderRadius: radius.button,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.radiusInsideBorder,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiNoticeTitle: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  aiNoticeText: {
    ...type.caption,
    color: colors.textPrimary,
    lineHeight: 17,
  },
  categoryChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillText: {
    ...type.micro,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  errorBox: {
    padding: spacing.s3,
    borderRadius: radius.button,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.errorFg,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.s2 + 2,
    paddingBottom: spacing.s2,
  },
  cancelBtn: { flex: 0.85 },
  submitBtn: { flex: 1.15 },
});
