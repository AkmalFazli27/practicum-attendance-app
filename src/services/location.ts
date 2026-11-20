import * as Location from 'expo-location';

import type { Koordinat } from '@/data/dummy';

export type IzinLokasi = 'diberikan' | 'ditolak' | 'belum-ditanya';

export type Langganan = { remove: () => void };

/** Membaca status izin lokasi foreground tanpa memunculkan dialog. */
export async function cekIzinLokasi(): Promise<IzinLokasi> {
  const hasil = await Location.getForegroundPermissionsAsync();
  if (hasil.granted) return 'diberikan';
  if (hasil.status === 'undetermined') return 'belum-ditanya';
  return 'ditolak';
}

/** Memunculkan dialog izin lokasi foreground. Mengembalikan true bila diizinkan. */
export async function mintaIzinLokasi(): Promise<boolean> {
  const hasil = await Location.requestForegroundPermissionsAsync();
  return hasil.granted;
}

/** True bila layanan lokasi (GPS) perangkat aktif. */
export async function layananLokasiAktif(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return false;
  }
}

/**
 * Berlangganan pembaruan posisi. Pemanggil wajib memanggil remove()
 * saat layar ditutup agar pemantauan berhenti.
 */
export async function pantauLokasi(
  onUpdate: (koordinat: Koordinat) => void,
  onError: (pesan: string) => void,
): Promise<Langganan> {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 3000,
      distanceInterval: 3,
    },
    (lokasi) => {
      onUpdate({
        lat: lokasi.coords.latitude,
        lng: lokasi.coords.longitude,
        akurasi: lokasi.coords.accuracy ?? undefined,
      });
    },
    (pesan) => onError(pesan),
  );
}