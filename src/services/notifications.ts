import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db, isFirebaseConfigured } from '@/config/firebase';
import type { Izin, Sesi, Tagihan, Pembayaran } from '@/data/dummy';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATAS_WAKTU_MS = 8000;
const UKURAN_BATCH = 100;
const POLA_TOKEN = /^Expo(nent)?PushToken\[.+\]$/;

export type JenisNotifikasi =
  | 'SESI_DIBUKA'
  | 'JADWAL_BERUBAH'
  | 'KEPUTUSAN_IZIN'
  | 'TAGIHAN_BARU'
  | 'PEMBAYARAN_BERHASIL'
  | 'PEMBAYARAN_GAGAL';

type Pesan = {
  title: string;
  body: string;
  data: { jenis: JenisNotifikasi; sesiId?: string; tagihanId?: string };
};

const rupiah = (n: number) => `Rp${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

function tokenValid(t: unknown): t is string {
  return typeof t === 'string' && POLA_TOKEN.test(t);
}

async function tokenPraktikanKelas(kelas: string): Promise<string[]> {
  const snap = await getDocs(
    query(
      collection(db, 'users'),
      where('peran', '==', 'praktikan'),
      where('kelas', '==', kelas),
    ),
  );
  const tokens = snap.docs.map((d) => d.data().pushToken).filter(tokenValid);
  return Array.from(new Set(tokens));
}

async function tokenPengguna(uid: string): Promise<string[]> {
  const snap = await getDoc(doc(db, 'users', uid));
  const t = snap.exists() ? snap.data().pushToken : undefined;
  return tokenValid(t) ? [t] : [];
}

async function kirimBatch(tokens: string[], pesan: Pesan): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BATAS_WAKTU_MS);
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          sound: 'default',
          title: pesan.title,
          body: pesan.body,
          data: pesan.data,
        })),
      ),
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const json = await res.json();
    const tiket: any[] = Array.isArray(json?.data) ? json.data : [];
    // Token perangkat yang sudah tidak terdaftar bukan kegagalan pengiriman.
    return tiket.every(
      (t) => t?.status === 'ok' || t?.details?.error === 'DeviceNotRegistered',
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function kirim(tokens: string[], pesan: Pesan): Promise<boolean> {
  if (tokens.length === 0) return true;
  const hasil: boolean[] = [];
  for (let i = 0; i < tokens.length; i += UKURAN_BATCH) {
    hasil.push(await kirimBatch(tokens.slice(i, i + UKURAN_BATCH), pesan));
  }
  return hasil.every(Boolean);
}

export async function notifySesiDibuka(sesi: Sesi): Promise<boolean> {
  if (!isFirebaseConfigured) return true;
  try {
    const tokens = await tokenPraktikanKelas(sesi.kelas);
    return await kirim(tokens, {
      title: 'Sesi presensi dibuka',
      body: `${sesi.namaPraktikum} (${sesi.kelas}) di ${sesi.lab} sudah dibuka. Segera lakukan presensi.`,
      data: { jenis: 'SESI_DIBUKA', sesiId: sesi.id },
    });
  } catch {
    return false;
  }
}

export async function notifyJadwalBerubah(sesi: Sesi): Promise<boolean> {
  if (!isFirebaseConfigured) return true;
  try {
    const tokens = await tokenPraktikanKelas(sesi.kelas);
    return await kirim(tokens, {
      title: 'Jadwal praktikum berubah',
      body: `${sesi.namaPraktikum} (${sesi.kelas}): ${sesi.tanggal}, ${sesi.jamMulai}–${sesi.jamSelesai} di ${sesi.lab}.`,
      data: { jenis: 'JADWAL_BERUBAH', sesiId: sesi.id },
    });
  } catch {
    return false;
  }
}

export async function notifyKeputusanIzin(
  izin: Izin,
  status: 'DITERIMA' | 'DITOLAK',
): Promise<boolean> {
  if (!isFirebaseConfigured) return true;
  try {
    const tokens = await tokenPengguna(izin.praktikanId);
    const diterima = status === 'DITERIMA';
    return await kirim(tokens, {
      title: diterima ? 'Izin diterima' : 'Izin ditolak',
      body: diterima
        ? 'Pengajuan izinmu telah diterima oleh asisten.'
        : 'Pengajuan izinmu ditolak oleh asisten.',
      data: { jenis: 'KEPUTUSAN_IZIN', sesiId: izin.sesiId },
    });
  } catch {
    return false;
  }
}

export async function notifyTagihanBaru(tagihan: Tagihan): Promise<boolean> {
  if (!isFirebaseConfigured) return true;
  try {
    const tokens = await tokenPengguna(tagihan.praktikanId);
    return await kirim(tokens, {
      title: 'Tagihan denda baru',
      body: `Kamu terlambat ${tagihan.menitTerlambat} menit. Denda ${rupiah(tagihan.nominal)}. Ketuk untuk membayar.`,
      data: { jenis: 'TAGIHAN_BARU', sesiId: tagihan.sesiId, tagihanId: tagihan.id },
    });
  } catch {
    return false;
  }
}

// Server (webhook) sudah mengirim push berhasil/gagal. Dua fungsi ini disediakan sesuai
// kontrak, tetapi JANGAN dipanggil dari context agar notifikasi tidak ganda.
export async function notifyPembayaranBerhasil(p: Pembayaran): Promise<boolean> {
  if (!isFirebaseConfigured) return true;
  try {
    const tokens = await tokenPengguna(p.praktikanId);
    return await kirim(tokens, {
      title: 'Pembayaran berhasil',
      body: 'Pembayaran dendamu sudah diterima.',
      data: { jenis: 'PEMBAYARAN_BERHASIL', tagihanId: p.tagihanId },
    });
  } catch {
    return false;
  }
}

export async function notifyPembayaranGagal(p: Pembayaran): Promise<boolean> {
  if (!isFirebaseConfigured) return true;
  try {
    const tokens = await tokenPengguna(p.praktikanId);
    return await kirim(tokens, {
      title: 'Pembayaran gagal',
      body: 'Pembayaran dendamu gagal. Coba bayar ulang.',
      data: { jenis: 'PEMBAYARAN_GAGAL', tagihanId: p.tagihanId },
    });
  } catch {
    return false;
  }
}