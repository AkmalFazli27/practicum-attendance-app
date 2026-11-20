import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { Koordinat } from '@/data/dummy';
import {
  cekIzinLokasi,
  layananLokasiAktif,
  mintaIzinLokasi,
  pantauLokasi,
  type Langganan,
} from '@/services/location';

export type StatusLokasi =
  | 'memuat'
  | 'siap'
  | 'izin-ditolak'
  | 'gps-mati'
  | 'koordinat-belum-ada'
  | 'error';

export type HasilLokasi = {
  status: StatusLokasi;
  koordinat: Koordinat | null;
  pesanError: string | null;
  mintaIzin: () => Promise<void>;
  coba: () => Promise<void>;
};

const BATAS_TUNGGU_MS = 15000;
const CEK_GPS_MS = 10000;

const PESAN = {
  gpsMati: 'Layanan lokasi di perangkat mati. Aktifkan GPS lalu coba lagi.',
  izinDitolak:
    'Izin lokasi ditolak. Izinkan akses lokasi di pengaturan aplikasi agar presensi dan peta dapat berfungsi.',
  belumAda:
    'Lokasi belum tersedia. Pastikan GPS aktif dan coba di tempat terbuka.',
  error: 'Gagal membaca lokasi perangkat. Silakan coba lagi.',
} as const;

const STATUS_GAGAL: StatusLokasi[] = [
  'izin-ditolak',
  'gps-mati',
  'koordinat-belum-ada',
  'error',
];

export function useLocation(): HasilLokasi {
  const [status, setStatus] = useState<StatusLokasi>('memuat');
  const [koordinat, setKoordinat] = useState<Koordinat | null>(null);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const statusRef = useRef<StatusLokasi>('memuat');
  const langgananRef = useRef<Langganan | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aktifRef = useRef<boolean>(true);
  const putaranRef = useRef<number>(0);

  const ubah = useCallback(
    (baru: StatusLokasi, pesan: string | null, hapusKoordinat = false) => {
      statusRef.current = baru;
      setStatus(baru);
      setPesanError(pesan);
      if (hapusKoordinat) setKoordinat(null);
    },
    [],
  );

  const hentikan = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (langgananRef.current) {
      langgananRef.current.remove();
      langgananRef.current = null;
    }
  }, []);

  const mulai = useCallback(
    async (bolehMinta: boolean) => {
      const putaran = ++putaranRef.current;
      const basi = () => !aktifRef.current || putaran !== putaranRef.current;

      hentikan();
      ubah('memuat', null);

      try {
        const gpsAktif = await layananLokasiAktif();
        if (basi()) return;
        if (!gpsAktif) {
          ubah('gps-mati', PESAN.gpsMati, true);
          return;
        }

        let izin = await cekIzinLokasi();
        if (izin === 'belum-ditanya' || (izin === 'ditolak' && bolehMinta)) {
          const diizinkan = await mintaIzinLokasi();
          izin = diizinkan ? 'diberikan' : 'ditolak';
        }
        if (basi()) return;

        if (izin !== 'diberikan') {
          ubah('izin-ditolak', PESAN.izinDitolak, true);
          return;
        }

        timerRef.current = setTimeout(() => {
          if (!basi() && statusRef.current === 'memuat') {
            ubah('koordinat-belum-ada', PESAN.belumAda);
          }
        }, BATAS_TUNGGU_MS);

        const langganan = await pantauLokasi(
          (k) => {
            if (basi()) return;
            setKoordinat(k);
            ubah('siap', null);
          },
          () => {
            if (basi()) return;
            ubah('error', PESAN.error);
          },
        );

        if (basi()) {
          langganan.remove();
          return;
        }
        langgananRef.current = langganan;
      } catch {
        if (basi()) return;
        ubah('error', PESAN.error, true);
      }
    },
    [hentikan, ubah],
  );

  useEffect(() => {
    aktifRef.current = true;
    void mulai(true);

    // Saat pengguna kembali dari pengaturan (mengaktifkan GPS atau izin),
    // coba lagi tanpa memunculkan dialog izin berulang.
    const langgananApp = AppState.addEventListener('change', (state) => {
      if (state === 'active' && STATUS_GAGAL.includes(statusRef.current)) {
        void mulai(false);
      }
    });

    // GPS bisa dimatikan dari panel notifikasi tanpa meninggalkan aplikasi.
    const pemeriksa = setInterval(async () => {
      const s = statusRef.current;
      if (s !== 'siap' && s !== 'koordinat-belum-ada' && s !== 'gps-mati') return;
      const aktif = await layananLokasiAktif();
      if (!aktifRef.current || statusRef.current !== s) return;
      if (!aktif && s !== 'gps-mati') {
        hentikan();
        ubah('gps-mati', PESAN.gpsMati, true);
      } else if (aktif && s === 'gps-mati') {
        void mulai(false);
      }
    }, CEK_GPS_MS);

    return () => {
      aktifRef.current = false;
      putaranRef.current += 1;
      hentikan();
      langgananApp.remove();
      clearInterval(pemeriksa);
    };
  }, [mulai, hentikan, ubah]);

  const mintaIzin = useCallback(() => mulai(true), [mulai]);
  const coba = useCallback(() => mulai(false), [mulai]);

  return { status, koordinat, pesanError, mintaIzin, coba };
}