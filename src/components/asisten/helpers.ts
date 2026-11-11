import { parseTanggal } from '@/utils/format';

const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

/** "08:00" -> "08.00" (format waktu antarmuka, DESIGN.md §8.3) */
export const titik = (jam: string) => jam.replace(':', '.');

/** "2026-10-21" -> "Rab, 21 Okt" */
export function tanggalSingkat(tanggal: string): string {
  const date = parseTanggal(tanggal);
  return `${HARI_SINGKAT[date.getDay()]}, ${date.getDate()} ${BULAN_SINGKAT[date.getMonth()]}`;
}

export function inisial(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? '')
    .join('');
}
