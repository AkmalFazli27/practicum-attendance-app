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
 * Validasi dilakukan di layar, bukan hanya di context: context menolak tanpa
 * memberi tahu field mana yang salah, sedangkan form perlu pesan inline.
 */
export function alasanTidakValid(draf: DrafLab): string[] {
  const alasan: string[] = [];
  if (!draf.labId) alasan.push('Pilih laboratorium terlebih dahulu.');
  if (!draf.titik) {
    alasan.push('Tentukan titik laboratorium pada peta.');
  } else if (!koordinatValid(draf.titik)) {
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
  return (
    Math.abs(draf.titik.lat - lab.lat) > EPSILON_KOORDINAT ||
    Math.abs(draf.titik.lng - lab.lng) > EPSILON_KOORDINAT
  );
}
