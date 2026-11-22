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
 * Kelompok tepat tiga marker memakai formasi sketsa dalam ruang layar;
 * kelompok lain disebar pada lingkaran dengan sudut dari hash id. Keduanya
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
 * menutup. Untuk dua marker pada lingkaran, jaraknya 2 × radius = 60 m.
 */
export const OFFSET_SEBARAN_M = 30;

/**
 * Region acuan untuk menerjemahkan offset layar ke derajat.
 *
 * Formasi tiga marker ditentukan dalam piksel layar karena skala vertikal dan
 * horizontal peta tidak sama: pada region 0.004° dan layar 412 × 700, 1 px
 * vertikal ≈ 0,59 px horizontal. Menentukan formasi dalam meter membuat
 * jarak antarmarker di layar meleset dari sketsa.
 */
const DELTA_ACUAN = 0.004;
const LEBAR_ACUAN_PX = 412;
const TINGGI_ACUAN_PX = 700;

/**
 * Formasi tiga marker dalam piksel layar, relatif terhadap titik gedung
 * (sumbu y ke bawah). Mengikuti sketsa: B di kiri-atas, C di bawah dekat B,
 * dan D di kanan. Slot ditentukan urutan `id`, jadi stabil terhadap urutan
 * dokumen dari Firestore.
 *
 * Angka ini hasil penyesuaian arah panah: B digeser kanan-bawah, C digeser
 * ke kanan, dan D digeser ke atas, sehingga ketiganya lebih mengumpul.
 * Jarak terdekat 41 px masih menyisakan celah ~3 px dari bubble 38 px.
 */
const FORMASI_TIGA_PX: ReadonlyArray<{ x: number; y: number }> = [
  { x: -18, y: -25 },
  { x: 0, y: 12 },
  { x: 38, y: -18 },
];

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
export const OFFSET_MAKS_M = 60;

/**
 * Radius lingkaran sebaran untuk `jumlah` marker. Kelompok yang lebih dari
 * tiga dilebarkan bertahap agar tali busurnya tetap ≥ ukuran bubble marker.
 */
function radiusSebaran(jumlah: number): number {
  if (jumlah <= 2) return OFFSET_SEBARAN_M;
  // Tali busur untuk n marker = 2r·sin(π/n); jaga agar tidak menyusut.
  const faktor = Math.sin(Math.PI / 3) / Math.sin(Math.PI / jumlah);
  return Math.min(OFFSET_SEBARAN_M * faktor, OFFSET_MAKS_M);
}

/**
 * Menggeser titik sejauh offset piksel acuan, lalu mengembalikannya sebagai
 * koordinat. Offset layar dikonversi lebih dulu ke derajat memakai delta
 * region acuan, dengan pembagian cos(lintang) untuk sumbu bujur.
 */
function geserPiksel(titik: Titik, offset: { x: number; y: number }): Titik {
  const dLat = -(offset.y * DELTA_ACUAN) / TINGGI_ACUAN_PX;
  const cosLat = Math.cos((titik.lat * Math.PI) / 180);
  const dLng =
    cosLat === 0 ? 0 : (offset.x * DELTA_ACUAN) / (LEBAR_ACUAN_PX * cosLat);
  return { lat: titik.lat + dLat, lng: titik.lng + dLng };
}

/**
 * Mengembalikan titik tampil per `lab.id`. Lab yang titiknya unik dipetakan
 * ke koordinat aslinya; lab yang berbagi titik disebar di sekitar titik
 * bersama. Kelompok tepat tiga marker memakai formasi sketsa dalam ruang
 * layar; kelompok lain memakai lingkaran yang radiusnya tumbuh bila
 * anggotanya banyak, dibatasi `OFFSET_MAKS_M` agar tidak terlihat lepas dari
 * gedungnya.
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

    // Urutkan berdasarkan id agar posisi tidak bergantung urutan Firestore.
    const terurut = [...anggota].sort((a, b) => (a.id < b.id ? -1 : 1));
    const pusat = { lat: terurut[0].lat, lng: terurut[0].lng };

    if (terurut.length === FORMASI_TIGA_PX.length) {
      terurut.forEach((lab, index) => {
        hasil.set(lab.id, geserPiksel(pusat, FORMASI_TIGA_PX[index]));
      });
      continue;
    }

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
