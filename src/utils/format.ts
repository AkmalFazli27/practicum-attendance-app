const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Mengubah "YYYY-MM-DD" menjadi Date lokal (bukan UTC). */
export function parseTanggal(tanggal: string): Date {
  const [tahun, bulan, hari] = tanggal.split('-').map(Number);
  return new Date(tahun, bulan - 1, hari);
}

/** "2026-10-21" -> "Rabu, 21 Oktober 2026" */
export function formatTanggal(tanggal: string): string {
  const date = parseTanggal(tanggal);
  return `${NAMA_HARI[date.getDay()]}, ${date.getDate()} ${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

/** ISO lokal -> "08:05" */
export function formatJam(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Waktu sekarang dalam ISO lokal tanpa zona (aman untuk data dummy S1). */
export function nowLocalISO(): string {
  const date = new Date();
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
