const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

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

const BULAN_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Mengubah "YYYY-MM-DD" menjadi Date lokal (bukan UTC). */
export function parseTanggal(tanggal: string): Date {
  const [tahun, bulan, hari] = tanggal.split('-').map(Number);
  if (!tahun || !bulan || !hari) {
    return new Date();
  }
  return new Date(tahun, bulan - 1, hari);
}

/** "2026-10-21" -> "Rabu, 21 Oktober 2026" */
export function formatTanggal(tanggal: string): string {
  const date = parseTanggal(tanggal);
  return `${NAMA_HARI[date.getDay()]}, ${date.getDate()} ${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

/** "2026-10-21" -> "Rabu, 21 Okt" */
export function formatHariTanggalSingkat(tanggal: string): string {
  const date = parseTanggal(tanggal);
  return `${NAMA_HARI[date.getDay()]}, ${date.getDate()} ${BULAN_SINGKAT[date.getMonth()]}`;
}

/** "2026-10-21" -> "Rab, 21 Okt" */
export function formatTanggalSingkat(tanggal: string): string {
  const date = parseTanggal(tanggal);
  return `${HARI_SINGKAT[date.getDay()]}, ${date.getDate()} ${BULAN_SINGKAT[date.getMonth()]}`;
}

/** "2026-10-21" -> { hari: "21", bulan: "OKT" } */
export function getTileTanggal(tanggal: string): { hari: string; bulan: string } {
  const date = parseTanggal(tanggal);
  return {
    hari: String(date.getDate()),
    bulan: (BULAN_SINGKAT[date.getMonth()] ?? 'OKT').toUpperCase(),
  };
}

/** "08:00" -> "08.00" */
export function titikJam(jam: string): string {
  return jam.replace(':', '.');
}

/** ISO lokal -> "08:05" */
export function formatJam(iso: string): string {
  if (!iso.includes('T')) {
    return iso.replace('.', ':');
  }
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Ambil 2 huruf inisial nama */
export function inisialNama(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? '')
    .join('');
}

/** Waktu sekarang dalam ISO lokal tanpa zona. */
export function nowLocalISO(): string {
  const date = new Date();
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
