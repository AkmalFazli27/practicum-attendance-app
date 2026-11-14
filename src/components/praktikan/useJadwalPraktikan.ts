import { useMemo } from 'react';

import { useSession } from '@/context/SessionContext';
import type { Sesi, StatusIzin } from '@/data/dummy';

export type RingkasanKehadiran = {
  total: number;
  hadir: number;
  izin: number;
  belumHadir: number;
  persen: number;
};

const normKelas = (k?: string) => (k ?? '').trim().toUpperCase();

export function useJadwalPraktikan() {
  const { currentUser, sesi, kehadiran, izin, loading } = useSession();

  const data = useMemo(() => {
    const uid = currentUser?.id;
    const kelasSaya = normKelas(currentUser?.kelas);

    const daftarKelas: Sesi[] = sesi
      .filter((s) => !kelasSaya || normKelas(s.kelas) === kelasSaya)
      .sort((a, b) =>
        `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`),
      );

    const hadirMap = new Map<string, string>(
      kehadiran
        .filter((k) => k.praktikanId === uid)
        .map((k) => [k.sesiId, k.waktuHadir]),
    );

    const izinMap = new Map<string, StatusIzin>(
      izin.filter((i) => i.praktikanId === uid).map((i) => [i.sesiId, i.status]),
    );

    const sesiAktif = daftarKelas.filter((s) => s.status === 'DIBUKA');

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
  }, [currentUser?.id, currentUser?.kelas, sesi, kehadiran, izin]);

  return { ...data, loading };
}