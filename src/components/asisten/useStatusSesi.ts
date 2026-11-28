import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/context/SessionContext';
import type { Sesi } from '@/data/dummy';
import { formatHariTanggalSingkat, titikJam } from '@/utils/format';
import { sudahMulai } from '@/utils/statusSesi';

/** Interval cek ulang waktu agar tampilan berubah tanpa reload (PB-06). */
const TICK_MS = 15_000;

export type AksiUtama =
  | { jenis: 'buka'; aktif: boolean; keterangan?: string }
  | { jenis: 'tutup' }
  | { jenis: 'selesai' };

const tanggalWIB = () =>
  new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

/**
 * Status sesi di sisi asisten, dihitung dari waktu lewat getStatusEfektif
 * (bukan dari field status langsung) dan dihitung ulang berkala.
 */
export function useStatusSesi() {
  const { t } = useTranslation();
  const { getStatusEfektif } = useSession();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const statusEfektif = (s: Sesi) => getStatusEfektif(s);

  const aksiUtama = (s: Sesi): AksiUtama => {
    const efektif = getStatusEfektif(s);
    if (efektif === 'SELESAI') return { jenis: 'selesai' };
    if (efektif === 'DIBUKA') return { jenis: 'tutup' };
    if (sudahMulai(s)) return { jenis: 'buka', aktif: true };
    const jam = titikJam(s.jamMulai);
    return {
      jenis: 'buka',
      aktif: false,
      keterangan:
        s.tanggal === tanggalWIB()
          ? t('asprak.canOpenAt', { jam })
          : t('asprak.canOpenOnDateAt', {
              tanggal: formatHariTanggalSingkat(s.tanggal),
              jam,
            }),
    };
  };

  return { statusEfektif, aksiUtama };
}
