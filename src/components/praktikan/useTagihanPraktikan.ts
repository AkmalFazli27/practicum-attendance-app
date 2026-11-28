import { useMemo } from 'react';

import { isFirebaseConfigured } from '@/config/firebase';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Kehadiran, Lab, Pembayaran, Sesi, Tagihan } from '@/data/dummy';

import { formatTanggalTagihan } from './formatTagihan';
import { PEMBAYARAN_STUB, TAGIHAN_STUB } from './tagihanStub';

export type TagihanTampil = {
  tagihan: Tagihan;
  sesi?: Sesi;
  lab?: Lab;
  judul: string;
  subjudul: string;
};

const PRIORITAS_STATUS: Record<Tagihan['status'], number> = {
  UNPAID: 0,
  PENDING: 1,
  FAILED: 2,
  PAID: 3,
  DIBEBASKAN: 4,
};

const STATUS_AKTIF: Tagihan['status'][] = ['UNPAID', 'PENDING', 'FAILED'];

function waktu(iso: string): number {
  const nilai = new Date(iso).getTime();
  return Number.isNaN(nilai) ? 0 : nilai;
}

export function useTagihanPraktikan() {
  const {
    currentUser,
    sesi,
    labs,
    kehadiran,
    tagihan,
    pembayaran,
    loading,
    error,
    retrySync,
  } = useSession();
  const { language } = usePreferences();
  const isEn = language === 'en';

  const sesiMap = useMemo(
    () => new Map<string, Sesi>(sesi.map((item) => [item.id, item])),
    [sesi],
  );

  const labMap = useMemo(
    () => new Map<string, Lab>(labs.map((item) => [item.id, item])),
    [labs],
  );

  const data = useMemo(() => {
    const uid = currentUser?.id;
    if (!uid) {
      return {
        daftar: [] as TagihanTampil[],
        totalTertunggak: 0,
        jumlahAktif: 0,
        pembayaran: [] as Pembayaran[],
        kehadiran: [] as Kehadiran[],
      };
    }

    const memakaiStub = !isFirebaseConfigured && tagihan.length === 0;

    // Mode dummy: tampilkan contoh tagihan agar alur baca bisa diuji.
    // Mode Firebase tidak pernah memakai stub supaya empty state asli terlihat.
    const sumberTagihan: Tagihan[] = memakaiStub
      ? TAGIHAN_STUB.map((item) => ({ ...item, praktikanId: uid }))
      : tagihan;
    const sumberPembayaran: Pembayaran[] = memakaiStub
      ? PEMBAYARAN_STUB.map((item) => ({ ...item, praktikanId: uid }))
      : pembayaran;

    const milikSaya = sumberTagihan.filter(
      (item) => item.praktikanId === uid,
    );
    const pembayaranSaya = sumberPembayaran.filter(
      (item) => item.praktikanId === uid,
    );

    const daftar = milikSaya
      .map((item): TagihanTampil => {
        const sesiItem = sesiMap.get(item.sesiId);
        const labItem = labMap.get(item.labId);
        const namaLab = labItem?.nama ?? sesiItem?.lab ?? 'Lab';
        const tanggal = sesiItem?.tanggal ?? item.dibuatPada;

        return {
          tagihan: item,
          sesi: sesiItem,
          lab: labItem,
          judul: sesiItem?.namaPraktikum ?? 'Sesi praktikum',
          subjudul: `${formatTanggalTagihan(tanggal, isEn)} · ${namaLab}`,
        };
      })
      .sort((a, b) => {
        const prioritas =
          PRIORITAS_STATUS[a.tagihan.status] -
          PRIORITAS_STATUS[b.tagihan.status];
        if (prioritas !== 0) return prioritas;
        return waktu(b.tagihan.dibuatPada) - waktu(a.tagihan.dibuatPada);
      });

    const aktif = milikSaya.filter((item) =>
      STATUS_AKTIF.includes(item.status),
    );

    return {
      daftar,
      totalTertunggak: aktif.reduce((total, item) => total + item.nominal, 0),
      jumlahAktif: aktif.length,
      pembayaran: pembayaranSaya,
      kehadiran: kehadiran.filter((item) => item.praktikanId === uid),
    };
  }, [
    currentUser?.id,
    tagihan,
    pembayaran,
    kehadiran,
    sesiMap,
    labMap,
    isEn,
  ]);

  return {
    ...data,
    sesiMap,
    labMap,
    loading,
    error,
    retrySync,
  };
}
