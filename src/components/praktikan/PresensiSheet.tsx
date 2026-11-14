import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ConfirmSheet, SheetModal, Tombol, useToast } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { colors, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, formatJam, titikJam } from '@/utils/format';

export interface PresensiSheetProps {
  /** Sesi yang dipresensi. null = sheet tertutup. */
  sesi: Sesi | null;
  onClose: () => void;
  onSuccess?: (waktuHadir: string) => void;
}

export function PresensiSheet({ sesi, onClose, onSuccess }: PresensiSheetProps) {
  const { currentUser, markAttendance } = useSession();
  const { showToast } = useToast();
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<{ judul: string; pesan: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sedangProses = useRef(false);

  const terakhir = useRef<Sesi | null>(null);
  if (sesi) terakhir.current = sesi;
  const tampil = sesi ?? terakhir.current;

  const visible = sesi !== null;

  useEffect(() => {
    if (visible) {
      setMemproses(false);
      sedangProses.current = false;
    }
  }, [visible]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function konfirmasi() {
    if (!sesi || sedangProses.current) return;
    sedangProses.current = true;
    setMemproses(true);

    timer.current = setTimeout(async () => {
      const hasil = await markAttendance(sesi.id);
      sedangProses.current = false;
      setMemproses(false);
      onClose();

      if (hasil.ok) {
        const jam = titikJam(formatJam(hasil.waktuHadir));
        showToast(`Presensi berhasil dicatat pukul ${jam}.`);
        onSuccess?.(hasil.waktuHadir);
        return;
      }

      timer.current = setTimeout(() => {
        setGalat({
          judul: hasil.alasan.startsWith('Kamu sudah presensi')
            ? 'Presensi sudah tercatat'
            : 'Presensi gagal',
          pesan: hasil.alasan,
        });
      }, 320);
    }, 350);
  }

  return (
    <>
      <ConfirmSheet
        visible={visible}
        title="Konfirmasi presensi"
        body="Pastikan kamu hadir secara langsung di ruang praktikum."
        requireDeclaration
        declarationLabel="Saya menyatakan hadir pada sesi ini."
        loading={memproses}
        confirmLabel="Ya, lanjutkan"
        summary={
          tampil
            ? [
                { label: 'Praktikum', value: tampil.namaPraktikum },
                {
                  label: 'Jadwal',
                  value: `${formatHariTanggalSingkat(tampil.tanggal)}, ${titikJam(tampil.jamMulai)}`,
                },
                { label: 'Nama', value: currentUser?.nama ?? '-' },
              ]
            : []
        }
        onConfirm={konfirmasi}
        onClose={onClose}
      />

      <SheetModal
        visible={galat !== null}
        judul={galat?.judul ?? ''}
        onClose={() => setGalat(null)}
        footer={
          <Tombol variant="sekunder" onPress={() => setGalat(null)}>
            Tutup
          </Tombol>
        }
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
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s3,
  },
  errorIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    ...type.bodyStrong,
    color: colors.errorFg,
  },
  errorPesan: {
    ...type.body,
    color: colors.textPrimary,
    flex: 1,
  },
});
