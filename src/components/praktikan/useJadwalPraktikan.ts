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

export function useJadwalPraktikan() {
  const { currentUser, sesi, kehadiran, izin } = useSession();

  return useMemo(() => {
    const uid = currentUser?.id;

    // Sesi milik kelas praktikan, urut tanggal + jam
    const daftarKelas: Sesi[] = sesi
      .filter((s) => !currentUser?.kelas || s.kelas === currentUser.kelas)
      .sort((a, b) =>
        `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`),
      );

    // sesiId -> waktuHadir (ISO)
    const hadirMap = new Map<string, string>(
      kehadiran
        .filter((k) => k.praktikanId === uid)
        .map((k) => [k.sesiId, k.waktuHadir]),
    );

    // sesiId -> status izin
    const izinMap = new Map<string, StatusIzin>(
      izin.filter((i) => i.praktikanId === uid).map((i) => [i.sesiId, i.status]),
    );

    const sesiAktif = daftarKelas.filter((s) => s.status === 'DIBUKA');

    const total = daftarKelas.length;
    const hadir = daftarKelas.filter((s) => hadirMap.has(s.id)).length;
    // Keputusan: hanya izin DITERIMA yang dihitung "izin"
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
}