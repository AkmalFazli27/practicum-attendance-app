import React, { useRef, useState } from 'react';
import { DoorOpen, LockKeyhole, RotateCcw } from 'lucide-react-native';

import { ConfirmSheet, useToast } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors } from '@/theme/tokens';
import { formatHariTanggalSingkat, titikJam } from '@/utils/format';

export type AksiSesi = 'buka' | 'tutup' | 'bukaLagi';

type Target = { sesiId: string; aksi: AksiSesi };

const COPY: Record<
  AksiSesi,
  { judul: string; isi: string; ya: string; toast: string }
> = {
  buka: {
    judul: 'Buka sesi ini?',
    isi: 'Sesi akan aktif dan praktikan dapat mulai melakukan presensi.',
    ya: 'Ya, lanjutkan',
    toast: 'Sesi berhasil dibuka.',
  },
  tutup: {
    judul: 'Tutup sesi ini?',
    isi: 'Praktikan tidak dapat melakukan presensi setelah sesi ditutup.',
    ya: 'Ya, tutup sesi',
    toast: 'Sesi berhasil ditutup.',
  },
  bukaLagi: {
    judul: 'Buka kembali sesi?',
    isi: 'Sesi akan kembali dibuka dan praktikan dapat melakukan presensi.',
    ya: 'Ya, buka lagi',
    toast: 'Sesi berhasil dibuka kembali.',
  },
};

export function useAksiSesi(onTidakDitemukan?: () => void) {
  const { openSession, closeSession, reopenSession, getSesiById } = useSession();
  const { showToast } = useToast();
  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(false);

  const terakhir = useRef<Target | null>(null);
  if (target) terakhir.current = target;
  const tampil = target ?? terakhir.current;
  const sesiTampil = tampil ? getSesiById(tampil.sesiId) : undefined;
  const copy = tampil ? COPY[tampil.aksi] : COPY.buka;

  function mulai(sesiId: string, aksi: AksiSesi) {
    setTarget({ sesiId, aksi });
  }

  function batal() {
    if (loading) return;
    setTarget(null);
  }

  function konfirmasi() {
    if (!target || loading) return;
    const { sesiId, aksi } = target;

    if (!getSesiById(sesiId)) {
      setTarget(null);
      showToast('Sesi tidak ditemukan.');
      onTidakDitemukan?.();
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (aksi === 'buka') openSession(sesiId);
      else if (aksi === 'tutup') closeSession(sesiId);
      else reopenSession(sesiId);

      setLoading(false);
      setTarget(null);
      showToast(COPY[aksi].toast);
    }, 220);
  }

  const isTutup = tampil?.aksi === 'tutup';

  const sheet = (
    <ConfirmSheet
      visible={target !== null}
      title={copy.judul}
      body={copy.isi}
      danger={isTutup}
      loading={loading}
      confirmLabel={copy.ya}
      icon={
        isTutup ? (
          <LockKeyhole size={27} color={colors.errorFg} />
        ) : tampil?.aksi === 'bukaLagi' ? (
          <RotateCcw size={27} color={colors.graphite} />
        ) : (
          <DoorOpen size={28} color={colors.graphite} />
        )
      }
      summary={
        sesiTampil
          ? [
              { label: 'Praktikum', value: sesiTampil.namaPraktikum },
              { label: 'Kelas & Lab', value: `${sesiTampil.kelas} · ${sesiTampil.lab}` },
              {
                label: 'Jadwal',
                value: `${formatHariTanggalSingkat(sesiTampil.tanggal)}, ${titikJam(sesiTampil.jamMulai)}`,
              },
            ]
          : []
      }
      onConfirm={konfirmasi}
      onClose={batal}
    />
  );

  return { mulai, sheet };
}
