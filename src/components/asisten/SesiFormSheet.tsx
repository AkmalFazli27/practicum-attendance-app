import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { SheetModal, Tombol, useToast } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

export interface SesiFormSheetProps {
  visible: boolean;
  initialSesi?: Sesi | null;
  onClose: () => void;
}

export function SesiFormSheet({
  visible,
  initialSesi = null,
  onClose,
}: SesiFormSheetProps) {
  const { createSession, updateSession } = useSession();
  const { showToast } = useToast();

  const isEdit = Boolean(initialSesi);

  const [namaPraktikum, setNamaPraktikum] = useState('');
  const [topik, setTopik] = useState('');
  const [kelas, setKelas] = useState('IF-2A');
  const [lab, setLab] = useState('Lab Multimedia');
  const [tanggal, setTanggal] = useState('2026-10-25');
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
      setLab(initialSesi.lab);
      setTanggal(initialSesi.tanggal);
      setJamMulai(initialSesi.jamMulai);
      setJamSelesai(initialSesi.jamSelesai);
      setKapasitas(String(initialSesi.kapasitas ?? 32));
      setDeskripsi(initialSesi.deskripsi);
    } else {
      setNamaPraktikum('');
      setTopik('');
      setKelas('IF-2A');
      setLab('Lab Komputer 1');
      setTanggal('2026-10-25');
      setJamMulai('08:00');
      setJamSelesai('10:00');
      setKapasitas('32');
      setDeskripsi('');
    }
  }, [visible, initialSesi]);

  const handleSimpan = async () => {
    if (menyimpan) return;
    if (!namaPraktikum.trim() || !kelas.trim() || !lab.trim() || !tanggal.trim()) {
      setGalat('Nama praktikum, kelas, laboratorium, dan tanggal wajib diisi.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal.trim())) {
      setGalat('Format tanggal harus YYYY-MM-DD (contoh: 2026-10-25).');
      return;
    }
    if (!jamMulai.trim() || !jamSelesai.trim()) {
      setGalat('Jam mulai dan jam selesai wajib diisi (contoh: 08:00).');
      return;
    }

    setGalat(null);
    setMenyimpan(true);

    const payload = {
      namaPraktikum: namaPraktikum.trim(),
      topik: topik.trim() || 'Materi Praktikum',
      kelas: kelas.trim().toUpperCase(),
      lab: lab.trim(),
      tanggal: tanggal.trim(),
      jamMulai: jamMulai.trim().replace('.', ':'),
      jamSelesai: jamSelesai.trim().replace('.', ':'),
      kapasitas: Math.max(1, parseInt(kapasitas, 10) || 32),
      deskripsi:
        deskripsi.trim() ||
        `Pertemuan praktikum ${namaPraktikum.trim()} untuk kelas ${kelas.trim().toUpperCase()}.`,
    };

    try {
      if (isEdit && initialSesi) {
        const berhasil = await updateSession(initialSesi.id, payload);
        setMenyimpan(false);
        if (!berhasil) {
          setGalat('Gagal memperbarui data sesi praktikum. Periksa koneksi Anda.');
          return;
        }
        showToast('Data sesi praktikum berhasil diperbarui.');
        onClose();
      } else {
        const sesiBaru = await createSession(payload);
        setMenyimpan(false);
        if (!sesiBaru) {
          setGalat('Gagal menambahkan sesi praktikum baru. Periksa koneksi Anda.');
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

  return (
    <SheetModal
      visible={visible}
      kicker={isEdit ? 'UBAH DATA SESI' : 'KELOLA PRAKTIKUM'}
      judul={isEdit ? 'Edit Sesi Praktikum' : 'Tambah Sesi Baru'}
      dismissible={!menyimpan}
      onClose={onClose}
      footer={
        <View style={styles.footerRow}>
          <Tombol
            variant="sekunder"
            disabled={menyimpan}
            onPress={onClose}
            style={styles.cancelBtn}
          >
            Batal
          </Tombol>
          <Tombol
            variant="primer"
            loading={menyimpan}
            onPress={handleSimpan}
            style={styles.submitBtn}
          >
            {isEdit ? 'Simpan Perubahan' : 'Tambah Sesi'}
          </Tombol>
        </View>
      }
    >
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nama praktikum</Text>
        <TextInput
          value={namaPraktikum}
          onChangeText={setNamaPraktikum}
          placeholder="Contoh: Pemrograman Web"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Topik pertemuan</Text>
        <TextInput
          value={topik}
          onChangeText={setTopik}
          placeholder="Contoh: Firebase Auth & Cloud Firestore"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldGroup, { flex: 0.9 }]}>
          <Text style={styles.label}>Kelas</Text>
          <TextInput
            value={kelas}
            onChangeText={setKelas}
            placeholder="IF-2A"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            style={styles.input}
          />
        </View>
        <View style={[styles.fieldGroup, { flex: 1.4 }]}>
          <Text style={styles.label}>Laboratorium</Text>
          <TextInput
            value={lab}
            onChangeText={setLab}
            placeholder="Lab Multimedia"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldGroup, { flex: 1.3 }]}>
          <Text style={styles.label}>Tanggal (YYYY-MM-DD)</Text>
          <TextInput
            value={tanggal}
            onChangeText={setTanggal}
            placeholder="2026-10-25"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>
        <View style={[styles.fieldGroup, { flex: 0.7 }]}>
          <Text style={styles.label}>Kapasitas</Text>
          <TextInput
            value={kapasitas}
            onChangeText={setKapasitas}
            placeholder="32"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.label}>Jam mulai</Text>
          <TextInput
            value={jamMulai}
            onChangeText={setJamMulai}
            placeholder="08:00"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.label}>Jam selesai</Text>
          <TextInput
            value={jamSelesai}
            onChangeText={setJamSelesai}
            placeholder="10:00"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Deskripsi materi</Text>
        <TextInput
          value={deskripsi}
          onChangeText={setDeskripsi}
          placeholder="Ringkasan kegiatan dan capaian praktikum pada sesi ini..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={[styles.input, styles.textArea]}
        />
      </View>

      {galat && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{galat}</Text>
        </View>
      )}
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

