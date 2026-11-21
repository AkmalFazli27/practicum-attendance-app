import React from 'react';
import { useRouter } from 'expo-router';

import { ConfirmSheet } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { formatHariTanggalSingkat, titikJam } from '@/utils/format';

export interface PresensiSheetProps {
  /** Sesi yang dipresensi. null = sheet tertutup. */
  sesi: Sesi | null;
  onClose: () => void;
  onSuccess?: (waktuHadir: string) => void;
}

/**
 * Komponen kompatibilitas presensi: pada Sprint 3 (FR-19), alur presensi
 * dialihkan ke halaman terpisah `/(praktikan)/presensi/[id]`.
 */
export function PresensiSheet({ sesi, onClose }: PresensiSheetProps) {
  const router = useRouter();
  const { currentUser } = useSession();

  const visible = sesi !== null;

  function bukaHalamanPresensi() {
    if (!sesi) return;
    const id = sesi.id;
    onClose();
    router.push({
      pathname: '/(praktikan)/presensi/[id]',
      params: { id },
    } as any);
  }

  return (
    <ConfirmSheet
      visible={visible}
      title="Lanjut ke Halaman Presensi"
      body="Presensi memerlukan pemeriksaan lokasi dan radius laboratorium."
      confirmLabel="Buka Halaman Presensi"
      summary={
        sesi
          ? [
              { label: 'Praktikum', value: sesi.namaPraktikum },
              {
                label: 'Jadwal',
                value: `${formatHariTanggalSingkat(sesi.tanggal)}, ${titikJam(sesi.jamMulai)}`,
              },
              { label: 'Nama', value: currentUser?.nama ?? '-' },
            ]
          : []
      }
      onConfirm={bukaHalamanPresensi}
      onClose={onClose}
    />
  );
}
