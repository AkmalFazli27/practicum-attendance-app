import type { Izin, Sesi } from '@/data/dummy';

export async function notifySesiDibuka(_sesi: Sesi): Promise<boolean> {
  return true;
}

export async function notifyJadwalBerubah(_sesi: Sesi): Promise<boolean> {
  return true;
}

export async function notifyKeputusanIzin(
  _izin: Izin,
  _status: 'DITERIMA' | 'DITOLAK',
): Promise<boolean> {
  return true;
}