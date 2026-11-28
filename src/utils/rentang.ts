/**
 * Helper rentang waktu Hari / Minggu / Bulan dalam zona WIB (UTC+7).
 * Minggu dihitung Senin sampai Minggu. Tanggal berformat YYYY-MM-DD (inklusif).
 */
export type Rentang = 'hari' | 'minggu' | 'bulan';

export type BatasRentang = { mulai: string; selesai: string };

const WIB_MS = 7 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** Tanggal WIB (YYYY-MM-DD) dari epoch ms. */
export function tanggalWib(ms: number = Date.now()): string {
  return fmt(new Date(ms + WIB_MS));
}

export function hitungRentang(
  rentang: Rentang,
  now: number = Date.now(),
): BatasRentang {
  const w = new Date(now + WIB_MS);
  const y = w.getUTCFullYear();
  const m = w.getUTCMonth();
  const d = w.getUTCDate();

  if (rentang === 'hari') {
    const t = fmt(w);
    return { mulai: t, selesai: t };
  }
  if (rentang === 'minggu') {
    const sejakSenin = (w.getUTCDay() + 6) % 7;
    return {
      mulai: fmt(new Date(Date.UTC(y, m, d - sejakSenin))),
      selesai: fmt(new Date(Date.UTC(y, m, d - sejakSenin + 6))),
    };
  }
  return {
    mulai: fmt(new Date(Date.UTC(y, m, 1))),
    selesai: fmt(new Date(Date.UTC(y, m + 1, 0))),
  };
}

export function dalamRentang(tanggal: string, batas: BatasRentang): boolean {
  return tanggal >= batas.mulai && tanggal <= batas.selesai;
}
