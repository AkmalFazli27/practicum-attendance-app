import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SheetModal, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { formatTanggal } from '@/utils/format';

const titik = (jam: string) => jam.replace(':', '.');

export interface PresensiSheetProps {
  /** Sesi yang dipresensi. null = sheet tertutup. */
  sesi: Sesi | null;
  onClose: () => void;
  onSuccess?: (waktuHadir: string) => void;
}

export function PresensiSheet({ sesi, onClose, onSuccess }: PresensiSheetProps) {
  const { currentUser, markAttendance } = useSession();
  const [dinyatakan, setDinyatakan] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<{ judul: string; pesan: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard sinkron: state `memproses` baru berubah setelah render, ref langsung.
  const sedangProses = useRef(false);

  // Simpan sesi terakhir supaya isi sheet tidak kosong saat animasi menutup.
  const terakhir = useRef<Sesi | null>(null);
  if (sesi) terakhir.current = sesi;
  const tampil = sesi ?? terakhir.current;

  const visible = sesi !== null;

  useEffect(() => {
    if (visible) {
      setDinyatakan(false);
      setMemproses(false);
      sedangProses.current = false;
    }
  }, [visible]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function konfirmasi() {
    if (!sesi || !dinyatakan || sedangProses.current) return;
    sedangProses.current = true;
    setMemproses(true);

    // Jeda singkat agar "Mencatat..." terlihat (data Sprint 1 sinkron).
    timer.current = setTimeout(() => {
      const hasil = markAttendance(sesi.id);
      sedangProses.current = false;
      setMemproses(false);
      onClose();

      if (hasil.ok) {
        onSuccess?.(hasil.waktuHadir);
        return;
      }

      // Tunggu sheet pertama selesai menutup (penting di iOS).
      timer.current = setTimeout(() => {
        setGalat({
          judul: hasil.alasan.startsWith('Kamu sudah presensi')
            ? 'Presensi sudah tercatat'
            : 'Presensi gagal',
          pesan: hasil.alasan,
        });
      }, 350);
    }, 400);
  }

  return (
    <>
      <SheetModal
        visible={visible}
        judul="Konfirmasi presensi"
        onClose={onClose}
        dismissible={!memproses}
        footer={
          <View style={styles.footerRow}>
            <Tombol variant="sekunder" onPress={onClose} disabled={memproses} style={styles.footerButton}>
              Batal
            </Tombol>
            <Tombol
              variant="primer"
              onPress={konfirmasi}
              disabled={!dinyatakan}
              loading={memproses}
              style={styles.footerButton}
            >
              {memproses ? 'Mencatat...' : 'Konfirmasi'}
            </Tombol>
          </View>
        }
      >
        {tampil && (
          <>
            <View>
              <Text style={styles.sesiNama}>{tampil.namaPraktikum} · {tampil.kelas}</Text>
              <Text style={styles.meta}>{formatTanggal(tampil.tanggal)}</Text>
              <Text style={styles.meta}>{titik(tampil.jamMulai)}–{titik(tampil.jamSelesai)}</Text>
            </View>

            <View>
              <Text style={styles.label}>Nama</Text>
              <View style={styles.inputBeku}>
                <Text style={styles.inputText}>{currentUser?.nama ?? '-'}</Text>
              </View>
            </View>

            <View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: dinyatakan, disabled: memproses }}
                disabled={memproses}
                onPress={() => setDinyatakan((v) => !v)}
                style={styles.checkRow}
              >
                <View style={[styles.checkBox, dinyatakan && styles.checkBoxOn]}>
                  {dinyatakan && <Text style={styles.checkTick}>✓</Text>}
                </View>
                <Text style={styles.checkLabel}>Saya hadir pada sesi ini</Text>
              </Pressable>
              {!dinyatakan && (
                <Text style={styles.hint}>Centang pernyataan untuk melanjutkan.</Text>
              )}
            </View>
          </>
        )}
      </SheetModal>

      <SheetModal
        visible={galat !== null}
        judul={galat?.judul ?? ''}
        onClose={() => setGalat(null)}
        footer={<Tombol variant="sekunder" onPress={() => setGalat(null)}>Tutup</Tombol>}
      >
        <View style={styles.errorRow}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>
          <Text style={styles.errorPesan}>{galat?.pesan}</Text>
        </View>
      </SheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', gap: spacing.s3, paddingBottom: spacing.s2 },
  footerButton: { flex: 1 },
  sesiNama: { ...type.bodyStrong, color: colors.textPrimary },
  meta: { ...type.body, color: colors.textSecondary },
  label: { ...type.caption, color: colors.textSecondary, marginBottom: spacing.s1 },
  inputBeku: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.s4,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceMuted,
  },
  inputText: { ...type.body, color: colors.textPrimary },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s3, minHeight: 48 },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.graphite, borderColor: colors.graphite },
  checkTick: { color: colors.onGraphite, fontSize: 14, lineHeight: 16 },
  checkLabel: { ...type.body, color: colors.textPrimary, flex: 1 },
  hint: { ...type.caption, color: colors.textMuted },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s3 },
  errorIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: { ...type.bodyStrong, color: colors.errorFg },
  errorPesan: { ...type.body, color: colors.textPrimary, flex: 1 },
});