import type { HasilAksi, AlasanTolak, Koordinat, Lab, Sesi, User } from '@/data/dummy';
import { hitungJarak, koordinatValid } from '@/utils/geo';
import { sudahLewat, sudahMulai } from '@/utils/statusSesi';

type Input = {
  sesi: Sesi | null;
  lab: Lab | null;
  user: User | null;
  koordinat: Koordinat | null;
  sudahHadir: boolean;
  sudahIzin: boolean;
  now?: number;
};

const tolak = (alasan: AlasanTolak): HasilAksi => ({ ok: false, alasan });

export function evaluasiPresensi({
  sesi,
  lab,
  user,
  koordinat,
  sudahHadir,
  sudahIzin,
  now = Date.now(),
}: Input): HasilAksi {
  if (!user || user.peran !== 'praktikan') return tolak('TIDAK_BERHAK');
  if (!sesi) return tolak('SESI_TIDAK_DIBUKA');
  if (
    user.kelas &&
    sesi.kelas.trim().toUpperCase() !== user.kelas.trim().toUpperCase()
  ) {
    return tolak('TIDAK_BERHAK');
  }
  if (sudahHadir) return tolak('SUDAH_PRESENSI');
  if (sudahIzin) return tolak('SUDAH_IZIN');
  if (sesi.status === 'SELESAI') return tolak('SESI_SUDAH_DITUTUP');
  if (sudahLewat(sesi, now)) return tolak('WAKTU_HABIS');
  if (!sudahMulai(sesi, now)) return tolak('BELUM_WAKTUNYA');
  if (sesi.status !== 'DIBUKA') return tolak('SESI_TIDAK_DIBUKA');
  if (!sesi.labId || !lab) return tolak('LAB_BELUM_DIATUR');
  if (!koordinat || !koordinatValid(koordinat)) return tolak('KOORDINAT_TIDAK_ADA');
  const jarak = Math.round(hitungJarak(koordinat, lab));
  if (jarak > lab.radius) return tolak('LUAR_RADIUS');
  return { ok: true, jarak };
}