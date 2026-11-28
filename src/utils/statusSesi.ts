import type { AlasanTolak, Sesi, StatusSesi } from '@/data/dummy';

type Jadwal = Pick<Sesi, 'tanggal' | 'jamMulai' | 'jamSelesai'>;

const RE_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const RE_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Masa berlaku maksimal QR presensi: 15 menit. */
export const QR_TTL_MS = 15 * 60 * 1000;

/** Jam operasional lab (WIB). Batas awal dan akhir sama-sama inklusif. */
export const JAM_OPERASIONAL = { buka: '07:00', tutup: '20:00' } as const;

/** Format HH:mm membuat perbandingan string setara dengan perbandingan waktu. */
export function dalamJamOperasional(
  j: Pick<Sesi, 'jamMulai' | 'jamSelesai'>,
): boolean {
  return j.jamMulai >= JAM_OPERASIONAL.buka && j.jamSelesai <= JAM_OPERASIONAL.tutup;
}

const keMs = (tanggal: string, jam: string) =>
  new Date(`${tanggal}T${jam}:00+07:00`).getTime();

export const waktuSelesaiMs = (s: Jadwal): number =>
  keMs(s.tanggal, s.jamSelesai);

export const waktuMulaiMs = (s: Jadwal): number =>
  keMs(s.tanggal, s.jamMulai);

export const sudahMulai = (s: Jadwal, now = Date.now()) =>
  now >= keMs(s.tanggal, s.jamMulai);

export const sudahLewat = (s: Jadwal, now = Date.now()) =>
  now > keMs(s.tanggal, s.jamSelesai);

/**
 * Menghitung waktu kedaluwarsa QR: maksimal 15 menit sejak dibuat/diperbarui,
 * dan tidak pernah melebihi batas waktu selesai sesi praktikum.
 * Contoh: jika sisa waktu praktikum 9 menit, QR hanya berlaku 9 menit.
 */
export function hitungQrExpiresAt(s: Jadwal, now = Date.now()): number {
  const selesai = waktuSelesaiMs(s);
  return Math.min(now + QR_TTL_MS, selesai);
}

const ALFABET_KODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Menghasilkan kode presensi 6 karakter yang mudah dibaca dan diketik. */
export function buatQrToken(): string {
  let kode = '';
  for (let i = 0; i < 6; i++) {
    kode += ALFABET_KODE[Math.floor(Math.random() * ALFABET_KODE.length)];
  }
  return kode;
}

export type HasilValidasiQr =
  | { ok: true }
  | { ok: false; alasan: 'QR_EXPIRED' | 'QR_INVALID' | 'WAKTU_HABIS' };

/**
 * Memeriksa apakah kode/token QR masih cocok dengan sesi dan belum kedaluwarsa.
 */
export function cekValiditasQr(
  s: Jadwal & Pick<Sesi, 'status' | 'qrToken' | 'qrExpiresAt'>,
  token?: string | null,
  now = Date.now(),
): HasilValidasiQr {
  if (sudahLewat(s, now)) {
    return { ok: false, alasan: 'WAKTU_HABIS' };
  }
  const expiresAt =
    typeof s.qrExpiresAt === 'number'
      ? Math.min(s.qrExpiresAt, waktuSelesaiMs(s))
      : null;
  if (!expiresAt || now > expiresAt) {
    return { ok: false, alasan: 'QR_EXPIRED' };
  }
  const expected = (s.qrToken ?? '').trim().toUpperCase();
  const given = (token ?? '').trim().toUpperCase();
  if (expected && !given) {
    return { ok: false, alasan: 'QR_INVALID' };
  }
  if (expected && given !== expected) {
    return { ok: false, alasan: 'QR_INVALID' };
  }
  return { ok: true };
}

export function getStatusEfektif(
  s: Jadwal & Pick<Sesi, 'status'>,
  now = Date.now(),
): StatusSesi {
  if (s.status === 'SELESAI' || sudahLewat(s, now)) return 'SELESAI';
  if (s.status === 'DIBUKA' && sudahMulai(s, now)) return 'DIBUKA';
  return 'TERJADWAL';
}

export function alasanTidakBisaDibuka(
  s: Jadwal & Pick<Sesi, 'status'>,
  now = Date.now(),
): AlasanTolak | null {
  if (s.status === 'SELESAI') return 'SESI_SUDAH_DITUTUP';
  if (sudahLewat(s, now)) return 'WAKTU_HABIS';
  if (!sudahMulai(s, now)) return 'BELUM_WAKTUNYA';
  return null;
}

export function validasiJadwal(
  j: Jadwal,
  now = Date.now(),
): { ok: true } | { ok: false; alasan: string } {
  const tanggalAda =
    RE_TANGGAL.test(j.tanggal) &&
    new Date(`${j.tanggal}T00:00:00Z`).toISOString().slice(0, 10) === j.tanggal;
  if (!tanggalAda) {
    return { ok: false, alasan: 'Format tanggal harus YYYY-MM-DD dan tanggalnya harus valid.' };
  }
  const tahunIni = new Date(now + 7 * 3600 * 1000).getUTCFullYear();
  if (Math.abs(Number(j.tanggal.slice(0, 4)) - tahunIni) > 1) {
    return { ok: false, alasan: 'Tanggal sesi tidak wajar.' };
  }
  if (!RE_JAM.test(j.jamMulai) || !RE_JAM.test(j.jamSelesai)) {
    return { ok: false, alasan: 'Format jam harus HH:mm (00:00 sampai 23:59).' };
  }
  if (j.jamSelesai <= j.jamMulai) {
    return { ok: false, alasan: 'Jam selesai harus setelah jam mulai.' };
  }
  if (!dalamJamOperasional(j)) {
    return {
      ok: false,
      alasan: 'Sesi hanya dapat dijadwalkan pada jam operasional lab, 07.00–20.00 WIB.',
    };
  }
  return { ok: true };
}