import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { usePreferences, type BahasaApp } from '@/context/PreferencesContext';
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

const PESAN: Record<
  BahasaApp,
  {
    'gps-mati': string;
    'izin-ditolak': string;
    'koordinat-belum-ada': string;
    error: string;
  }
> = {
  id: {
    'gps-mati':
      'Layanan lokasi di perangkat mati. Aktifkan GPS lalu coba lagi.',
    'izin-ditolak':
      'Izin lokasi ditolak. Izinkan akses lokasi di pengaturan aplikasi agar presensi dan peta dapat berfungsi.',
    'koordinat-belum-ada':
      'Lokasi belum tersedia. Pastikan GPS aktif dan coba di tempat terbuka.',
    error: 'Gagal membaca lokasi perangkat. Silakan coba lagi.',
  },
  en: {
    'gps-mati':
      'Device location services are off. Enable GPS and try again.',
    'izin-ditolak':
      'Location permission was denied. Allow location access in app settings so attendance and maps can work.',
    'koordinat-belum-ada':
      'Location is not available yet. Ensure GPS is enabled and try in an open area.',
    error: 'Failed to read device location. Please try again.',
  },
};

const STATUS_GAGAL: StatusLokasi[] = [
  'izin-ditolak',
  'gps-mati',
  'koordinat-belum-ada',
  'error',
];

export function useLocation(): HasilLokasi {
  const { language } = usePreferences();
  const [status, setStatus] = useState<StatusLokasi>('memuat');
  const [koordinat, setKoordinat] = useState<Koordinat | null>(null);

  const statusRef = useRef<StatusLokasi>('memuat');
  const langgananRef = useRef<Langganan | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aktifRef = useRef<boolean>(true);
  const putaranRef = useRef<number>(0);

  const ubah = useCallback(
    (baru: StatusLokasi, hapusKoordinat = false) => {
      statusRef.current = baru;
      setStatus(baru);
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
      ubah('memuat');

      try {
        const gpsAktif = await layananLokasiAktif();
        if (basi()) return;
        if (!gpsAktif) {
          ubah('gps-mati', true);
          return;
        }

        let izin = await cekIzinLokasi();
        if (izin === 'belum-ditanya' || (izin === 'ditolak' && bolehMinta)) {
          const diizinkan = await mintaIzinLokasi();
          izin = diizinkan ? 'diberikan' : 'ditolak';
        }
        if (basi()) return;

        if (izin !== 'diberikan') {
          ubah('izin-ditolak', true);
          return;
        }

        timerRef.current = setTimeout(() => {
          if (!basi() && statusRef.current === 'memuat') {
            ubah('koordinat-belum-ada');
          }
        }, BATAS_TUNGGU_MS);

        const langganan = await pantauLokasi(
          (k) => {
            if (basi()) return;
            setKoordinat(k);
            ubah('siap');
          },
          () => {
            if (basi()) return;
            ubah('error');
          },
        );

        if (basi()) {
          langganan.remove();
          return;
        }
        langgananRef.current = langganan;
      } catch {
        if (basi()) return;
        ubah('error', true);
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
        ubah('gps-mati', true);
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

  const pesanError = useMemo(() => {
    if (
      status === 'gps-mati' ||
      status === 'izin-ditolak' ||
      status === 'koordinat-belum-ada' ||
      status === 'error'
    ) {
      return PESAN[language][status];
    }
    return null;
  }, [status, language]);

  const mintaIzin = useCallback(() => mulai(true), [mulai]);
  const coba = useCallback(() => mulai(false), [mulai]);

  return { status, koordinat, pesanError, mintaIzin, coba };
}
