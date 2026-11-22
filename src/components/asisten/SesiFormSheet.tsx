import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { SheetModal, Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { nowLocalISO } from '@/utils/format';
import { validasiJadwal } from '@/utils/statusSesi';
import { PickerJam } from './PickerJam';
import { PilihLab } from './PilihLab';
import { PickerTanggal } from './PickerTanggal';
import { validasiFormSesi } from './validasiSesi';

export interface SesiFormSheetProps {
  visible: boolean;
  initialSesi?: Sesi | null;
  onClose: () => void;
}

const hariIni = () => nowLocalISO().slice(0, 10);

export function SesiFormSheet({
  visible,
  initialSesi = null,
  onClose,
}: SesiFormSheetProps) {
  const { createSession, updateSession, labs } = useSession();
  const { showToast } = useToast();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';

  const isEdit = Boolean(initialSesi);

  const [namaPraktikum, setNamaPraktikum] = useState('');
  const [topik, setTopik] = useState('');
  const [kelas, setKelas] = useState('IF-2A');
  const [labId, setLabId] = useState('');
  const [tanggal, setTanggal] = useState(hariIni());
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('10:00');
  const [kapasitas, setKapasitas] = useState('32');
  const [deskripsi, setDeskripsi] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setGalat(null);
    setMenyimpan(false);
    if (initialSesi) {
      setNamaPraktikum(initialSesi.namaPraktikum);
      setTopik(initialSesi.topik ?? '');
      setKelas(initialSesi.kelas);
      setLabId(
        initialSesi.labId ??
        labs.find((l) => l.nama === initialSesi.lab)?.id ??
        '',
      );
      setTanggal(initialSesi.tanggal);
      setJamMulai(initialSesi.jamMulai);
      setJamSelesai(initialSesi.jamSelesai);
      setKapasitas(String(initialSesi.kapasitas ?? 32));
      setDeskripsi(initialSesi.deskripsi);
    } else {
      setNamaPraktikum('');
      setTopik('');
      setKelas('IF-2A');
      setLabId('');
      setTanggal(hariIni());
      setJamMulai('08:00');
      setJamSelesai('10:00');
      setKapasitas('32');
      setDeskripsi('');
    }
  }, [visible, initialSesi]); // eslint-disable-line react-hooks/exhaustive-deps

  const labTerpilih = labs.find((l) => l.id === labId);

  const handleSimpan = async () => {
    if (menyimpan) return;

    const hasil = validasiFormSesi(
      {
        namaPraktikum,
        topik,
        kelas,
        lab: labTerpilih?.nama ?? '',
        tanggal,
        jamMulai,
        jamSelesai,
        kapasitas,
        deskripsi,
      },
      initialSesi
        ? {
          tanggal: initialSesi.tanggal,
          jamMulai: initialSesi.jamMulai,
          jamSelesai: initialSesi.jamSelesai,
        }
        : undefined,
    );
    if (!hasil.ok) {
      setGalat(hasil.pesan);
      return;
    }

    const jadwal = validasiJadwal({
      tanggal: hasil.data.tanggal,
      jamMulai: hasil.data.jamMulai,
      jamSelesai: hasil.data.jamSelesai,
    });
    if (!jadwal.ok) {
      setGalat(jadwal.alasan);
      return;
    }

    setGalat(null);
    setMenyimpan(true);
    const payload = { ...hasil.data, lab: labTerpilih!.nama, labId };

    try {
      if (isEdit && initialSesi) {
        const hasilUbah = await updateSession(initialSesi.id, payload);
        setMenyimpan(false);
        if (!hasilUbah.ok) {
          setGalat(hasilUbah.alasan);
          return;
        }
        showToast(
          hasilUbah.notifGagal
            ? 'Data sesi praktikum berhasil diperbarui. Namun notifikasi ke praktikan gagal terkirim.'
            : 'Data sesi praktikum berhasil diperbarui.',
        );
        onClose();
      } else {
        const hasilBuat = await createSession(payload);
        setMenyimpan(false);
        if (!hasilBuat.ok) {
          setGalat(hasilBuat.alasan);
          return;
        }
        showToast('Sesi praktikum baru berhasil ditambahkan.');
        onClose();
      }
    } catch {
      setMenyimpan(false);
      setGalat('Terjadi kesalahan saat menyimpan sesi praktikum.');
    }
  };

  const inputDynamicStyle = {
    borderColor: themeColors.border,
    backgroundColor: themeColors.surface,
    color: themeColors.textPrimary,
  };
  const labelDynamicStyle = { color: themeColors.textPrimary };

  return (
    <SheetModal
      visible={visible}
      kicker={
        isEdit
          ? isEn
            ? 'EDIT SESSION'
            : 'UBAH DATA SESI'
          : isEn
            ? 'MANAGE PRACTICUM'
            : 'KELOLA PRAKTIKUM'
      }
      judul={
        isEdit
          ? isEn
            ? 'Edit Practicum Session'
            : 'Edit Sesi Praktikum'
          : isEn
            ? 'Add New Session'
            : 'Tambah Sesi Baru'
      }
      dismissible={!menyimpan}
      onClose={onClose}
      footer={
        <View style={styles.footerWrap}>
          {galat && (
            <View
              accessibilityLiveRegion="polite"
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
          <View style={styles.footerRow}>
            <Tombol
              variant="sekunder"
              disabled={menyimpan}
              onPress={onClose}
              style={styles.cancelBtn}
            >
              {isEn ? 'Cancel' : 'Batal'}
            </Tombol>
            <Tombol
              variant="primer"
              loading={menyimpan}
              onPress={handleSimpan}
              style={styles.submitBtn}
            >
              {isEdit
                ? isEn
                  ? 'Save Changes'
                  : 'Simpan Perubahan'
                : isEn
                  ? 'Add Session'
                  : 'Tambah Sesi'}
            </Tombol>
          </View>
        </View>
      }
    >
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, labelDynamicStyle]}>
          {isEn ? 'Practicum name' : 'Nama praktikum'}
        </Text>
        <TextInput
          value={namaPraktikum}
          onChangeText={setNamaPraktikum}
          placeholder={
            isEn ? 'Example: Web Programming' : 'Contoh: Pemrograman Web'
          }
          placeholderTextColor={themeColors.textMuted}
          style={[styles.input, inputDynamicStyle]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, labelDynamicStyle]}>
          {isEn ? 'Meeting topic' : 'Topik pertemuan'}
        </Text>
        <TextInput
          value={topik}
          onChangeText={setTopik}
          placeholder={
            isEn
              ? 'Example: Firebase Auth & Cloud Firestore'
              : 'Contoh: Firebase Auth & Cloud Firestore'
          }
          placeholderTextColor={themeColors.textMuted}
          style={[styles.input, inputDynamicStyle]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, labelDynamicStyle]}>
          {isEn ? 'Class' : 'Kelas'}
        </Text>
        <TextInput
          value={kelas}
          onChangeText={setKelas}
          placeholder="IF-2A"
          placeholderTextColor={themeColors.textMuted}
          autoCapitalize="characters"
          style={[styles.input, inputDynamicStyle]}
        />
      </View>

      <PilihLab
        labs={labs}
        value={labId}
        onChange={(l) => {
          setLabId(l.id);
          setGalat(null);
        }}
        disabled={menyimpan}
      />

      <PickerTanggal
        label={isEn ? 'Date' : 'Tanggal'}
        value={tanggal}
        onChange={(t) => {
          setTanggal(t);
          setGalat(null);
        }}
        minTanggal={
          initialSesi?.tanggal && initialSesi.tanggal < hariIni()
            ? initialSesi.tanggal
            : hariIni()
        }
        disabled={menyimpan}
      />

      <View style={styles.row}>
        <PickerJam
          label={isEn ? 'Start time' : 'Jam mulai'}
          value={jamMulai}
          onChange={(j) => {
            setJamMulai(j);
            setGalat(null);
          }}
          disabled={menyimpan}
        />
        <PickerJam
          label={isEn ? 'End time' : 'Jam selesai'}
          value={jamSelesai}
          onChange={(j) => {
            setJamSelesai(j);
            setGalat(null);
          }}
          disabled={menyimpan}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, labelDynamicStyle]}>
          {isEn ? 'Capacity' : 'Kapasitas'}
        </Text>
        <TextInput
          value={kapasitas}
          onChangeText={setKapasitas}
          placeholder="32"
          placeholderTextColor={themeColors.textMuted}
          keyboardType="number-pad"
          style={[styles.input, inputDynamicStyle]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, labelDynamicStyle]}>
          {isEn ? 'Session description' : 'Deskripsi materi'}
        </Text>
        <TextInput
          value={deskripsi}
          onChangeText={setDeskripsi}
          placeholder={
            isEn
              ? 'Summary of activities and learning goals for this session...'
              : 'Ringkasan kegiatan dan capaian praktikum pada sesi ini...'
          }
          placeholderTextColor={themeColors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={[styles.input, styles.textArea, inputDynamicStyle]}
        />
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.s3,
  },
  label: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  input: {
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s3 + 2,
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  textArea: {
    height: 84,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s3,
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
  footerWrap: {
    gap: spacing.s2,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.s2 + 2,
    paddingBottom: spacing.s2,
  },
  cancelBtn: {
    flex: 0.85,
  },
  submitBtn: {
    flex: 1.15,
  },
});

