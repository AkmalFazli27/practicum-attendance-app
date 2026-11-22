import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useSession } from '@/context/SessionContext';
import type { Sesi, StatusIzin } from '@/data/dummy';
import { bandingkanSesiJadwal } from '@/utils/urutanJadwal';

export type RingkasanKehadiran = {
  total: number;
  hadir: number;
  izin: number;
  belumHadir: number;
  persen: number;
};

const normKelas = (k?: string) => (k ?? '').trim().toUpperCase();
const TICK_WAKTU_MS = 15_000;

export function useJadwalPraktikan() {
  const {
    currentUser,
    sesi,
    kehadiran,
    izin,
    getStatusEfektif,
    loading,
    error,
    retrySync,
  } = useSession();

  const [tick, setTick] = useState(0);

  // Periksa ulang waktu secara berkala & saat kembali ke aplikasi agar status efektif sesi (PB-06) berubah tanpa reload
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), TICK_WAKTU_MS);
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') setTick((n) => n + 1);
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  const data = useMemo(() => {
    const uid = currentUser?.id;
    const kelasSaya = normKelas(currentUser?.kelas);

    const daftarKelas: Sesi[] = sesi
      .filter((s) => !kelasSaya || normKelas(s.kelas) === kelasSaya)
      .map((s) => ({
        ...s,
        status: getStatusEfektif(s),
      }))
      .sort(bandingkanSesiJadwal);

    const hadirMap = new Map<string, string>(
      kehadiran
        .filter((k) => k.praktikanId === uid)
        .map((k) => [k.sesiId, k.waktuHadir]),
    );

    const izinMap = new Map<string, StatusIzin>(
      izin
        .filter((i) => i.praktikanId === uid)
        .map((i) => [i.sesiId, i.status]),
    );

    const sesiAktif = daftarKelas.filter(
      (s) => getStatusEfektif(s) === 'DIBUKA',
    );

    const total = daftarKelas.length;
    const hadir = daftarKelas.filter((s) => hadirMap.has(s.id)).length;
    const izinDiterima = daftarKelas.filter(
      (s) => !hadirMap.has(s.id) && izinMap.get(s.id) === 'DITERIMA',
    ).length;

    const ringkasan: RingkasanKehadiran = {
      total,
      hadir,
      izin: izinDiterima,
      belumHadir: Math.max(0, total - hadir - izinDiterima),
      persen: total === 0 ? 0 : Math.round((hadir / total) * 100),
    };

    return { daftarKelas, hadirMap, izinMap, sesiAktif, ringkasan };
  }, [
    currentUser?.id,
    currentUser?.kelas,
    sesi,
    kehadiran,
    izin,
    getStatusEfektif,
    tick,
  ]);

  return { ...data, loading, error, retrySync };
}
