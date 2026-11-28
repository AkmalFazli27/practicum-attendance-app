import { useMemo } from 'react';

import { useSession } from '@/context/SessionContext';
import type { Lab, Sesi } from '@/data/dummy';

/** Sesi & lab yang boleh dikelola Asprak: hanya dari lab tempat ia terdaftar (peran 'asprak'). */
export function useSesiAsprak() {
  const { currentUser, sesi, labs, keanggotaanLab } = useSession();

  return useMemo(() => {
    const uid = currentUser?.id;
    const labIds = new Set(
      keanggotaanLab
        .filter((k) => k.uid === uid && k.peran === 'asprak')
        .map((k) => k.labId),
    );
    // Fallback sementara selama keanggotaanLab belum terisi dari PM
    const pakaiKeanggotaan = keanggotaanLab.length > 0;

    const labsSaya: Lab[] = pakaiKeanggotaan
      ? labs.filter((l) => labIds.has(l.id))
      : labs;

    const bolehKelola = (s: Sesi): boolean =>
      !!uid &&
      (pakaiKeanggotaan ? !!s.labId && labIds.has(s.labId) : s.asistenId === uid);

    const sesiSaya = sesi
      .filter(bolehKelola)
      .sort((a, b) =>
        `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`),
      );

    return { sesiSaya, labsSaya, bolehKelola };
  }, [currentUser?.id, sesi, labs, keanggotaanLab]);
}