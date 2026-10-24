import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SheetModal, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, spacing, type } from '@/theme/tokens';

export type AksiSesi = 'buka' | 'tutup' | 'bukaLagi';

type Target = { sesiId: string; aksi: AksiSesi };

// Copywriting baku: DESIGN.md §8.2
const COPY: Record<AksiSesi, { judul: string; isi: string; ya: string }> = {
  buka: {
    judul: 'Buka sesi?',
    isi: 'Sesi akan dibuka dan praktikan dapat melakukan presensi.',
    ya: 'Ya, buka',
  },
  tutup: {
    judul: 'Tutup sesi?',
    isi: 'Presensi baru tidak dapat masuk setelah sesi ditutup.',
    ya: 'Ya, tutup',
  },
  bukaLagi: {
    judul: 'Buka kembali sesi ini?',
    isi: 'Praktikan dapat kembali melakukan presensi.',
    ya: 'Ya, buka',
  },
};

/**
 * Satu pintu untuk aksi buka / tutup / buka lagi (FR-04, FR-10).
 * Dipakai beranda dan detail agar konfirmasinya tidak diduplikasi.
 *
 * Pemakaian:
 *   const { mulai, sheet } = useAksiSesi();
 *   <Tombol onPress={() => mulai(s.id, 'tutup')}>Tutup</Tombol>
 *   ...
 *   {sheet}   // letakkan sekali di JSX layar
 */
export function useAksiSesi(onTidakDitemukan?: () => void) {
  const { openSession, closeSession, reopenSession, getSesiById } = useSession();
  const [target, setTarget] = useState<Target | null>(null);
  const [galat, setGalat] = useState(false);

  // Simpan target terakhir agar isi sheet tidak kosong saat animasi tutup.
  const terakhir = useRef<Target | null>(null);
  if (target) terakhir.current = target;
  const tampil = target ?? terakhir.current;
  const sesiTampil = tampil ? getSesiById(tampil.sesiId) : undefined;
  const copy = tampil ? COPY[tampil.aksi] : COPY.buka;

  function mulai(sesiId: string, aksi: AksiSesi) {
    setTarget({ sesiId, aksi });
  }

  function batal() {
    setTarget(null); // menutup sheet tidak menjalankan aksi
  }

  function konfirmasi() {
    if (!target) return;
    const { sesiId, aksi } = target;
    setTarget(null);

    if (!getSesiById(sesiId)) {
      setGalat(true);
      return;
    }
    if (aksi === 'buka') openSession(sesiId);
    else if (aksi === 'tutup') closeSession(sesiId);
    else reopenSession(sesiId);
  }

  function tutupGalat() {
    setGalat(false);
    onTidakDitemukan?.();
  }

  const sheet = (
    <>
      <SheetModal
        visible={target !== null}
        judul={copy.judul}
        onClose={batal}
        footer={
          <View style={styles.footer}>
            <Tombol variant="sekunder" onPress={batal} style={styles.footerTombol}>
              Batal
            </Tombol>
            <Tombol variant="primer" onPress={konfirmasi} style={styles.footerTombol}>
              {copy.ya}
            </Tombol>
          </View>
        }
      >
        {sesiTampil && (
          <Text style={styles.sesi}>
            {sesiTampil.namaPraktikum} · {sesiTampil.kelas}
          </Text>
        )}
        <Text style={styles.isi}>{copy.isi}</Text>
      </SheetModal>

      <SheetModal
        visible={galat}
        judul="Sesi tidak ditemukan"
        onClose={tutupGalat}
        footer={
          <Tombol variant="sekunder" onPress={tutupGalat}>
            Tutup
          </Tombol>
        }
      >
        <Text style={styles.isi}>Sesi ini sudah tidak tersedia.</Text>
      </SheetModal>
    </>
  );

  return { mulai, sheet };
}

const styles = StyleSheet.create({
  sesi: { ...type.bodyStrong, color: colors.textPrimary },
  isi: { ...type.body, color: colors.textSecondary },
  footer: { flexDirection: 'row', gap: spacing.s3, paddingBottom: spacing.s2 },
  footerTombol: { flex: 1 },
});
