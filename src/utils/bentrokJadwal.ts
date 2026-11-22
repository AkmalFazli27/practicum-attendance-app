import type { Sesi } from '@/data/dummy';

type Jadwal = {
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  kelas: string;
  labId?: string;
  lab?: string;
  asistenId?: string;
};

export type HasilBentrok =
  | { ok: true }
  | { ok: false; alasan: string; sesi: Sesi };

const norm = (s?: string) => (s || '').trim().toLowerCase();

/**
 * Mencari sesi yang bentrok dengan jadwal baru: tanggal sama, jam bertumpang
 * tindih, dan lab, kelas, atau asisten yang sama. abaikanId dipakai saat ubah
 * sesi supaya sesi itu tidak dibandingkan dengan dirinya sendiri.
 */
export function cariBentrokJadwal(
  baru: Jadwal,
  daftar: Sesi[],
  abaikanId?: string,
): HasilBentrok {
  for (const s of daftar) {
    if (abaikanId && s.id === abaikanId) continue;
    if (s.tanggal !== baru.tanggal) continue;

    // Format HH:mm selalu dua digit, jadi aman dibandingkan sebagai string.
    const tumpangTindih =
      baru.jamMulai < s.jamSelesai && baru.jamSelesai > s.jamMulai;
    if (!tumpangTindih) continue;

    const waktu = `${s.jamMulai}–${s.jamSelesai}`;

    const labSama =
      baru.labId && s.labId
        ? baru.labId === s.labId
        : norm(baru.lab) !== '' && norm(baru.lab) === norm(s.lab);
    if (labSama) {
      return {
        ok: false,
        sesi: s,
        alasan: `${s.lab || 'Lab'} sudah dipakai "${s.namaPraktikum}" pada ${waktu} di tanggal yang sama.`,
      };
    }

    if (norm(baru.kelas) === norm(s.kelas)) {
      return {
        ok: false,
        sesi: s,
        alasan: `Kelas ${s.kelas} sudah punya sesi "${s.namaPraktikum}" pada ${waktu} di tanggal yang sama.`,
      };
    }

    if (baru.asistenId && baru.asistenId === s.asistenId) {
      return {
        ok: false,
        sesi: s,
        alasan: `Kamu sudah mengelola sesi "${s.namaPraktikum}" pada ${waktu} di tanggal yang sama.`,
      };
    }
  }
  return { ok: true };
}