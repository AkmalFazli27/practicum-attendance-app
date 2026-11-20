import type { Lab } from '@/data/dummy';
import { koordinatValid, type Titik } from '@/utils/geo';

/** Draf yang sedang diedit di halaman Kelola Lab. */
export type DrafLab = {
  labId: string | null;
  titik: Titik | null;
  radius: number;
};

/**
 * Input radius diketik bebas, jadi koma desimal diterima dan spasi dibuang.
 * Hasil `null` berarti teks belum bisa dibaca sebagai angka; nol dan negatif
 * tetap diteruskan supaya pesan validasi yang sama menanganinya.
 */
export function parseRadius(teks: string): number | null {
  const bersih = teks.trim().replace(',', '.');
  if (!bersih) return null;
  if (!/^-?\d+(\.\d+)?$/.test(bersih)) return null;
  const angka = Number(bersih);
  return Number.isFinite(angka) ? angka : null;
}

/**
 * Input koordinat web harus menerima teks setengah jadi seperti "-" atau
 * "-7." tanpa langsung dianggap nol. Nilai yang belum sah menjadi NaN agar
 * validasi menolak, bukan diam-diam menyimpan 0,0.
 */
export function bacaAngka(teks: string): number {
  const bersih = teks.trim().replace(',', '.');
  if (!bersih || !/^-?\d*\.?\d*$/.test(bersih)) return Number.NaN;
  const angka = Number(bersih);
  return Number.isFinite(angka) ? angka : Number.NaN;
}

/** Menampilkan angka ke input tanpa "NaN"/"undefined" saat data belum ada. */
export function teksKoordinat(angka: number | undefined): string {
  return typeof angka === 'number' && Number.isFinite(angka)
    ? String(angka)
    : '';
}

/**
 * Menentukan teks yang ditampilkan input setelah prop titik berubah.
 * Teks setengah jadi seperti "-" bernilai NaN; membandingkan NaN === NaN selalu
 * salah, jadi input akan terhapus sendiri saat pengguna baru mulai mengetik.
 * Karena itu NaN dibandingkan sebagai "sama" dengan NaN, kecuali teks kosong
 * yang memang berarti pengguna mengosongkan field.
 */
export function teksTersinkron(
  teksLama: string,
  angkaBaru: number | undefined,
): string {
  const angkaLama = bacaAngka(teksLama);
  const kosong = teksLama.trim() === '';
  if (kosong) return teksKoordinat(angkaBaru);
  if (Number.isNaN(angkaLama) && Number.isNaN(angkaBaru)) return teksLama;
  if (angkaLama === angkaBaru) return teksLama;
  return teksKoordinat(angkaBaru);
}

/**
 * Validasi dilakukan di layar, bukan hanya di context: context menolak tanpa
 * memberi tahu field mana yang salah, sedangkan form perlu pesan inline.
 */
export function alasanTidakValid(draf: DrafLab): string[] {
  const alasan: string[] = [];
  if (!draf.labId) alasan.push('Pilih laboratorium terlebih dahulu.');
  if (!draf.titik) {
    alasan.push('Tentukan titik laboratorium pada peta.');
  } else if (!koordinatValid(draf.titik) || (draf.titik.lat === 0 && draf.titik.lng === 0)) {
    // Titik 0,0 lolos `koordinatValid` tetapi bukan lokasi lab yang sah dan
    // akan hilang dari peta, jadi diperlakukan sama dengan koordinat invalid.
    alasan.push('Koordinat laboratorium tidak valid.');
  }
  if (!Number.isFinite(draf.radius) || draf.radius <= 0) {
    alasan.push('Radius harus lebih dari 0 meter.');
  }
  return alasan;
}

/** Toleransi ~1 cm agar guncangan kecil saat drag marker tidak dianggap edit. */
const EPSILON_KOORDINAT = 1e-7;

/**
 * Tombol simpan dimatikan bila tidak ada yang berubah, sehingga asisten tidak
 * menulis dokumen yang sama berulang kali.
 */
export function adaPerubahan(lab: Lab, draf: DrafLab): boolean {
  if (draf.labId !== lab.id) return true;
  if (!draf.titik) return true;
  if (draf.radius !== lab.radius) return true;
  // NaN berarti asisten sedang mengosongkan input; itu perubahan yang harus
  // bisa disimpan-paksa agar pesan validasinya muncul.
  if (!Number.isFinite(draf.titik.lat) || !Number.isFinite(draf.titik.lng)) {
    return true;
  }
  return (
    Math.abs(draf.titik.lat - lab.lat) > EPSILON_KOORDINAT ||
    Math.abs(draf.titik.lng - lab.lng) > EPSILON_KOORDINAT
  );
}
