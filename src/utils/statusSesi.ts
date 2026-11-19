import type { AlasanTolak, Sesi, StatusSesi } from '@/data/dummy';

type Jadwal = Pick<Sesi, 'tanggal' | 'jamMulai' | 'jamSelesai'>;

const RE_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const RE_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

const keMs = (tanggal: string, jam: string) =>
  new Date(`${tanggal}T${jam}:00+07:00`).getTime();

export const sudahMulai = (s: Jadwal, now = Date.now()) =>
  now >= keMs(s.tanggal, s.jamMulai);

export const sudahLewat = (s: Jadwal, now = Date.now()) =>
  now > keMs(s.tanggal, s.jamSelesai);

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
  return { ok: true };
}