import { useMemo } from 'react';

import { isFirebaseConfigured } from '@/config/firebase';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Kehadiran, Lab, Sesi } from '@/data/dummy';

import { formatTanggalTagihan } from './formatTagihan';
import {
  PEMBAYARAN_STUB,
  TAGIHAN_STUB,
  type PembayaranLokal,
  type TagihanLokal,
} from './tagihanStub';

export type TagihanTampil = {
  tagihan: TagihanLokal;
  sesi?: Sesi;
  lab?: Lab;
  judul: string;
  subjudul: string;
};

/**
 * Bridge sementara ke kontrak PM yang belum merge.
 * TODO(sprint4): hapus cast ini setelah `tagihan`/`pembayaran`
 * tersedia resmi di `SessionContextValue`.
 */
type TagihanKonteks = {
  tagihan?: TagihanLokal[];
  pembayaran?: PembayaranLokal[];
};

const PRIORITAS_STATUS: Record<TagihanLokal['status'], number> = {
  UNPAID: 0,
  PENDING: 1,
  FAILED: 2,
  PAID: 3,
  DIBEBASKAN: 4,
};

const STATUS_AKTIF: TagihanLokal['status'][] = ['UNPAID', 'PENDING', 'FAILED'];

function waktu(iso: string): number {
  const nilai = new Date(iso).getTime();
  return Number.isNaN(nilai) ? 0 : nilai;
}

export function useTagihanPraktikan() {
  const session = useSession() as ReturnType<typeof useSession> &
    TagihanKonteks;
  const { currentUser, sesi, labs, kehadiran, loading, error, retrySync } =
    session;
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
        pembayaran: [] as PembayaranLokal[],
        kehadiran: [] as Kehadiran[],
      };
    }

    const tagihanKonteks = session.tagihan ?? [];
    const pembayaranKonteks = session.pembayaran ?? [];
    const memakaiStub =
      !isFirebaseConfigured && tagihanKonteks.length === 0;

    // Mode dummy: tampilkan contoh tagihan agar alur baca bisa diuji.
    // Mode Firebase tidak pernah memakai stub supaya empty state asli terlihat.
    const sumberTagihan = memakaiStub
      ? TAGIHAN_STUB.map((item) => ({ ...item, praktikanId: uid }))
      : tagihanKonteks;
    const sumberPembayaran = memakaiStub
      ? PEMBAYARAN_STUB.map((item) => ({ ...item, praktikanId: uid }))
      : pembayaranKonteks;

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
    session.tagihan,
    session.pembayaran,
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
