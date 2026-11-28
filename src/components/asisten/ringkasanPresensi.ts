import type { Izin, Kehadiran, Keanggotaan, Sesi, User } from '@/data/dummy';

export type RingkasanPresensi = {
  tepatWaktu: number;
  terlambat: number;
  izin: number;
  belumHadir: number;
};

const norm = (k?: string) => (k ?? '').trim().toUpperCase();

export function idPraktikanSesi(
  s: Sesi,
  users: User[],
  keanggotaanLab: Keanggotaan[],
): string[] {
  const dariLab = keanggotaanLab.filter(
    (k) => k.labId === s.labId && k.peran === 'praktikan',
  );
  if (dariLab.length > 0) return dariLab.map((k) => k.uid);
  // Fallback sementara: praktikan dengan kelas yang sama
  return users
    .filter((u) => u.peran === 'praktikan' && norm(u.kelas) === norm(s.kelas))
    .map((u) => u.id);
}

export function hitungPresensiSesi(input: {
  sesi: Sesi;
  kehadiran: Kehadiran[];
  izin: Izin[];
  users: User[];
  keanggotaanLab: Keanggotaan[];
}): RingkasanPresensi {
  const { sesi, kehadiran, izin, users, keanggotaanLab } = input;
  const hadir = kehadiran.filter((k) => k.sesiId === sesi.id);
  // Status dibaca dari Firestore, tidak dihitung ulang. Data lama tanpa status dianggap tepat waktu.
  const terlambat = hadir.filter((k) => k.statusKehadiran === 'TERLAMBAT').length;
  const izinAktif = izin.filter((i) => i.sesiId === sesi.id && i.status !== 'DITOLAK');

  const sudahAda = new Set<string>([
    ...hadir.map((k) => k.praktikanId),
    ...izinAktif.map((i) => i.praktikanId),
  ]);
  const belumHadir = idPraktikanSesi(sesi, users, keanggotaanLab).filter(
    (id) => !sudahAda.has(id),
  ).length;

  return {
    tepatWaktu: hadir.length - terlambat,
    terlambat,
    izin: izinAktif.length,
    belumHadir,
  };
}