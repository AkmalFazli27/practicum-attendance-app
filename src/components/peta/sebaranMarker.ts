/**
 * Menyebarkan marker lab yang bertitik sama agar bisa dibedakan di peta.
 *
 * Lab B, C, dan D berada di gedung dan lantai yang sama, sehingga koordinat
 * Firestore-nya identik dan marker saling menumpuk — hanya marker terakhir
 * yang bisa diketuk. Penyebaran di sini **hanya untuk tampilan**: koordinat
 * asli tetap dipakai untuk validasi radius presensi dan perhitungan jarak.
 *
 * Offset sengaja kecil (beberapa puluh meter) supaya pada zoom out marker
 * masih terlihat berdekatan di atas gedungnya, lalu mekar saat zoom in.
 * Posisi tiap marker dihitung dari hash id-nya, bukan urutan data, agar
 * stabil walau Firestore mengirim dokumen dengan urutan berbeda.
 */
import type { Lab } from '@/data/dummy';
import { koordinatValid, type Titik } from '@/utils/geo';

/**
 * Jarak tampilan tiap marker dari titik gedung aslinya, dalam meter.
 *
 * Angka ini diturunkan dari region minimum peta (`DELTA_MINIMUM` 0.004°,
 * ≈445 m pada layar 412 px) dan ukuran bubble marker 38 px: pada zoom awal
 * 1 px ≈ 1,08 m, sehingga jarak antar-marker perlu ≥ ~43 m agar tidak saling
 * menutup. Untuk tiga marker pada lingkaran, tali busur = √3 × radius,
 * jadi radius 30 m memberi jarak ≈52 m (≈48 px) — cukup terpisah.
 */
export const OFFSET_SEBARAN_M = 30;

/** Panjang 1 derajat lintang dalam meter (radius bumi rata-rata). */
const METER_PER_DERAJAT_LAT = 111_320;

/** Koordinat dibulatkan agar perbedaan pembulatan kecil tetap satu grup. */
const PRESISI_GRUP = 6;

function kunciGrup(lab: Lab): string {
  return `${lab.lat.toFixed(PRESISI_GRUP)},${lab.lng.toFixed(PRESISI_GRUP)}`;
}

/** Hash deterministik (FNV-1a 32-bit) untuk sudut awal tiap lab. */
function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Geser satu titik sejauh `meter` pada arah `sudut` (radian). */
function geserTitik(titik: Titik, sudut: number, meter: number): Titik {
  const dLat = (meter * Math.cos(sudut)) / METER_PER_DERAJAT_LAT;
  // Lingkaran bujur mengecil mendekati kutub, jadi bagi dengan cos(lintang).
  const cosLat = Math.cos((titik.lat * Math.PI) / 180);
  const dLng =
    cosLat === 0
      ? 0
      : (meter * Math.sin(sudut)) / (METER_PER_DERAJAT_LAT * cosLat);
  return { lat: titik.lat + dLat, lng: titik.lng + dLng };
}

/** Batas atas radius sebaran agar marker tidak terlihat lepas dari gedungnya. */
const OFFSET_MAKS_M = 60;

/**
 * Radius lingkaran sebaran untuk `jumlah` marker. Tiga marker dianggap kasus
 * umum (Lab B/C/D) dan memakai `OFFSET_SEBARAN_M`; kelompok yang lebih besar
 * dilebarkan bertahap agar tali busurnya tetap ≥ ukuran bubble marker.
 */
function radiusSebaran(jumlah: number): number {
  if (jumlah <= 3) return OFFSET_SEBARAN_M;
  // Tali busur untuk n marker = 2r·sin(π/n); jaga agar tidak menyusut.
  const faktor = Math.sin(Math.PI / 3) / Math.sin(Math.PI / jumlah);
  return Math.min(OFFSET_SEBARAN_M * faktor, OFFSET_MAKS_M);
}

/**
 * Mengembalikan titik tampil per `lab.id`. Lab yang titiknya unik dipetakan
 * ke koordinat aslinya; lab yang berbagi titik disebar merata pada lingkaran
 * di sekitar titik bersama. Radius lingkaran tumbuh bila anggotanya banyak
 * supaya marker tetap terpisah, tetapi berhenti di batas `OFFSET_MAKS_M`
 * agar tidak terlihat lepas dari gedungnya.
 */
export function titikTampilMarker(labs: Lab[]): Map<string, Titik> {
  const hasil = new Map<string, Titik>();

  // Kelompokkan hanya lab dengan koordinat sah; sisanya diteruskan apa adanya
  // agar pemanggil tetap bisa menampilkan marker bermasalah seperti biasa.
  const grup = new Map<string, Lab[]>();
  for (const lab of labs) {
    if (!koordinatValid(lab)) {
      hasil.set(lab.id, { lat: lab.lat, lng: lab.lng });
      continue;
    }
    const kunci = kunciGrup(lab);
    const anggota = grup.get(kunci);
    if (anggota) {
      anggota.push(lab);
    } else {
      grup.set(kunci, [lab]);
    }
  }

  for (const anggota of grup.values()) {
    if (anggota.length === 1) {
      const [lab] = anggota;
      hasil.set(lab.id, { lat: lab.lat, lng: lab.lng });
      continue;
    }

    // Urutkan berdasarkan id agar sudut tidak bergantung urutan Firestore.
    const terurut = [...anggota].sort((a, b) => (a.id < b.id ? -1 : 1));
    const pusat = { lat: terurut[0].lat, lng: terurut[0].lng };
    // Sudut dasar dari id pertama membuat pola tidak selalu mulai dari timur.
    const sudutDasar = (hashId(terurut[0].id) % 360) * (Math.PI / 180);
    const radius = radiusSebaran(terurut.length);

    terurut.forEach((lab, index) => {
      const sudut = sudutDasar + (index * 2 * Math.PI) / terurut.length;
      hasil.set(lab.id, geserTitik(pusat, sudut, radius));
    });
  }

  return hasil;
}
