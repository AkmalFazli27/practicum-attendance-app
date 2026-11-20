import type { Lab } from '@/data/dummy';
import { koordinatValid, type Titik } from '@/utils/geo';

export type RegionPeta = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Titik tengah kampus FSM UNDIP sebagai fallback saat data lab belum ada. */
export const REGION_KAMPUS_FSM: RegionPeta = {
  latitude: -7.0486,
  longitude: 110.4411,
  latitudeDelta: 0.006,
  longitudeDelta: 0.006,
};

const DELTA_MINIMUM = 0.004;
const PADDING = 1.6;

/**
 * Data lab dari Firestore bisa memiliki koordinat kosong. Titik 0,0 juga
 * ditolak karena bukan lokasi lab yang sah dan biasanya berasal dari field
 * null yang dikonversi menjadi angka 0.
 */
export function labPunyaKoordinat(lab: Lab): boolean {
  return koordinatValid(lab) && !(lab.lat === 0 && lab.lng === 0);
}

/** Lokasi pengguna hanya dipakai bila benar-benar angka yang masuk akal. */
export function lokasiPunyaKoordinat(
  lokasi: Titik | null | undefined,
): boolean {
  return (
    !!lokasi && koordinatValid(lokasi) && !(lokasi.lat === 0 && lokasi.lng === 0)
  );
}

/**
 * Menghitung region peta dari seluruh lab dan, bila tersedia, posisi pengguna.
 * Delta minimum menjaga Lab B/C/D yang bertitik sama tidak membuat peta
 * memperbesar satu titik secara berlebihan.
 */
export function hitungRegion(
  labs: Lab[],
  pengguna?: Titik | null,
): RegionPeta {
  const titik: Titik[] = labs
    .filter(labPunyaKoordinat)
    .map((lab) => ({ lat: lab.lat, lng: lab.lng }));

  if (lokasiPunyaKoordinat(pengguna)) {
    titik.push({ lat: pengguna!.lat, lng: pengguna!.lng });
  }

  if (titik.length === 0) return { ...REGION_KAMPUS_FSM };

  let minLat = titik[0].lat;
  let maxLat = titik[0].lat;
  let minLng = titik[0].lng;
  let maxLng = titik[0].lng;

  for (const t of titik) {
    minLat = Math.min(minLat, t.lat);
    maxLat = Math.max(maxLat, t.lat);
    minLng = Math.min(minLng, t.lng);
    maxLng = Math.max(maxLng, t.lng);
  }

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * PADDING, DELTA_MINIMUM),
    longitudeDelta: Math.max((maxLng - minLng) * PADDING, DELTA_MINIMUM),
  };
}
