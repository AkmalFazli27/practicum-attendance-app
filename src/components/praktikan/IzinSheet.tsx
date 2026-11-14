import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { SheetModal, Tombol, useToast } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, titikJam } from '@/utils/format';

export interface IzinSheetProps {
  sesi: Sesi | null;
  onClose: () => void;
}

export function IzinSheet({ sesi, onClose }: IzinSheetProps) {
  const { currentUser, submitIzin, getIzinBySesiPraktikan } = useSession();
  const { showToast } = useToast();

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
    if (alasan.trim().length < 10) {
      setGalat('Tuliskan alasan ketidakhadiran minimal 10 karakter.');
      return;
    }
    if (currentUser && getIzinBySesiPraktikan(sesi.id, currentUser.id)) {
      setGalat('Kamu sudah mengajukan izin untuk sesi ini.');
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

      const aiFallback = /fallback/i.test(hasil.izin.ringkasanAi ?? '');
      showToast(
        aiFallback
          ? 'Izin diajukan. Layanan AI sedang tidak tersedia, klasifikasi dibuat sementara. Menunggu pemeriksaan asisten.'
          : `Izin diajukan (AI: ${hasil.izin.kategoriAi}). Menunggu pemeriksaan asisten.`,
      );
    } catch (e: any) {
      setMengirim(false);
      setGalat(
        e?.message || 'Gagal mengirimkan pengajuan izin. Periksa koneksimu.',
      );
    }
  };

  return (
    <SheetModal
      visible={visible}
      kicker="PENGAJUAN IZIN"
      judul="Ajukan Izin Praktikum"
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
            Batal
          </Tombol>
          <Tombol
            variant="primer"
            loading={mengirim}
            disabled={alasan.trim().length < 10}
            onPress={handleKirim}
            style={styles.submitBtn}
          >
            {mengirim ? 'Menganalisis & Mengirim...' : 'Kirim Pengajuan'}
          </Tombol>
        </View>
      }
    >
      {sesi && (
        <>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Praktikum</Text>
              <Text style={styles.summaryVal}>{sesi.namaPraktikum}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowBorder]}>
              <Text style={styles.summaryLabel}>Jadwal</Text>
              <Text style={styles.summaryVal}>
                {formatHariTanggalSingkat(sesi.tanggal)} ·{' '}
                {titikJam(sesi.jamMulai)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowBorder]}>
              <Text style={styles.summaryLabel}>Praktikan</Text>
              <Text style={styles.summaryVal}>{currentUser?.nama ?? '-'}</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Alasan ketidakhadiran</Text>
            <TextInput
              value={alasan}
              onChangeText={(txt) => {
                setAlasan(txt);
                if (galat) setGalat(null);
              }}
              placeholder="Jelaskan alasan kamu berhalangan hadir (misal: sakit demam dan istirahat medis, atau delegasi lomba kampus)..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!mengirim}
              style={styles.textArea}
            />
          </View>

          <View style={styles.aiNotice}>
            <Sparkles size={16} color={colors.sesiDibukaFg} />
            <Text style={styles.aiNoticeText}>
              Alasan izin akan diklasifikasikan oleh model AI sebagai informasi
              pendukung bagi asisten. Keputusan akhir tetap ditentukan oleh
              asisten.
            </Text>
          </View>

          {galat && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{galat}</Text>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s2 + 2,
    padding: spacing.s3,
    borderRadius: radius.button,
    backgroundColor: colors.primarySoft,
  },
  aiNoticeText: {
    ...type.caption,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 17,
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