import type { Sesi, StatusIzin } from '@/data/dummy';

type SesiUrut = Pick<Sesi, 'tanggal' | 'jamMulai' | 'status'>;

/** Kunci kronologis "YYYY-MM-DD HH:mm" yang aman dibandingkan secara leksikografis. */
const kunciWaktu = (s: Pick<Sesi, 'tanggal' | 'jamMulai'>) =>
  `${s.tanggal} ${s.jamMulai}`;

/**
 * Urutan tampilan jadwal praktikan:
 * - Sesi yang belum selesai (terjadwal/dibuka) naik: yang paling dekat tampil paling atas.
 * - Sesi selesai turun: yang paling baru selesai tampil paling atas di kelompoknya.
 */
export function bandingkanSesiJadwal(a: SesiUrut, b: SesiUrut): number {
  const aSelesai = a.status === 'SELESAI';
  const bSelesai = b.status === 'SELESAI';
  if (aSelesai !== bSelesai) return aSelesai ? 1 : -1;
  const selisih = kunciWaktu(a).localeCompare(kunciWaktu(b));
  return aSelesai ? -selisih : selisih;
}

/**
 * Indeks sesi `SELESAI` pertama pada daftar yang sudah diurutkan.
 * Bernilai -1 bila tidak ada sesi selesai.
 */
export function indeksAwalSelesai(list: Pick<Sesi, 'status'>[]): number {
  return list.findIndex((s) => s.status === 'SELESAI');
}

/** Apakah pengajuan izin ini ditampilkan pada filter `Izin` (menunggu atau diterima). */
export function izinDitampilkan(status?: StatusIzin): boolean {
  return status === 'MENUNGGU' || status === 'DITERIMA';
}
