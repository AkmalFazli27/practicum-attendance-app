import React, { useRef, useState } from 'react';
import { DoorOpen, LockKeyhole } from 'lucide-react-native';

import { ConfirmSheet, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { AlasanTolak } from '@/data/dummy';
import { formatHariTanggalSingkat, titikJam } from '@/utils/format';

export type AksiSesi = 'buka' | 'tutup';

type Target = { sesiId: string; aksi: AksiSesi };

const COPY_ID: Record<
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
};

const COPY_EN: Record<
  AksiSesi,
  { judul: string; isi: string; ya: string; toast: string }
> = {
  buka: {
    judul: 'Open this session?',
    isi: 'The session will become active and students can start checking in.',
    ya: 'Yes, continue',
    toast: 'Session opened successfully.',
  },
  tutup: {
    judul: 'Close this session?',
    isi: 'Students will no longer be able to check in once this session is closed.',
    ya: 'Yes, close session',
    toast: 'Session closed successfully.',
  },
};

const PESAN_TOLAK: Partial<Record<AlasanTolak, string>> = {
  BELUM_WAKTUNYA: 'Sesi belum bisa dibuka. Tunggu sampai jam mulai.',
  WAKTU_HABIS: 'Waktu sesi sudah berakhir, sesi tidak dapat dibuka.',
  SESI_SUDAH_DITUTUP: 'Sesi yang sudah ditutup tidak dapat dibuka lagi.',
  SESI_TIDAK_DIBUKA: 'Sesi tidak ditemukan.',
  DI_LUAR_JAM_OPERASIONAL:
    'Sesi hanya dapat dibuka pada jam operasional lab (07.00–20.00 WIB).',
  JARINGAN: 'Gagal mengubah status sesi. Periksa koneksi lalu coba lagi.',
};

export function useAksiSesi(onTidakDitemukan?: () => void) {
  const { openSession, closeSession, getSesiById } = useSession();
  const { showToast } = useToast();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const COPY = isEn ? COPY_EN : COPY_ID;
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

  async function konfirmasi() {
    if (!target || loading) return;
    const { sesiId, aksi } = target;

    if (!getSesiById(sesiId)) {
      setTarget(null);
      showToast('Sesi tidak ditemukan.');
      onTidakDitemukan?.();
      return;
    }

    setLoading(true);
    if (aksi === 'buka') {
      const hasil = await openSession(sesiId);
      setLoading(false);
      setTarget(null);
      if (!hasil.ok) {
        showToast(
          PESAN_TOLAK[hasil.alasan] ??
            'Gagal mengubah status sesi praktikum. Silakan coba lagi.',
        );
        return;
      }
      showToast(
        hasil.notifGagal
          ? 'Sesi dibuka, tetapi notifikasi ke praktikan gagal terkirim.'
          : COPY.buka.toast,
      );
      return;
    }

    const berhasil = await closeSession(sesiId);
    setLoading(false);
    setTarget(null);
    showToast(
      berhasil
        ? COPY.tutup.toast
        : 'Gagal mengubah status sesi praktikum. Silakan coba lagi.',
    );
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
          <LockKeyhole size={27} color={themeColors.errorFg} />
        ) : (
          <DoorOpen size={28} color={themeColors.onPrimary} />
        )
      }
      summary={
        sesiTampil
          ? [
              {
                label: isEn ? 'Practicum' : 'Praktikum',
                value: sesiTampil.namaPraktikum,
              },
              {
                label: isEn ? 'Class & Lab' : 'Kelas & Lab',
                value: `${sesiTampil.kelas} · ${sesiTampil.lab}`,
              },
              {
                label: isEn ? 'Schedule' : 'Jadwal',
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