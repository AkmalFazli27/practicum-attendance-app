import type { Keanggotaan, Lab, Sesi, Tagihan, User } from '@/data/dummy';
import { getStatusEfektif } from '@/utils/statusSesi';

export type Rentang = 'hari' | 'minggu' | 'bulan';
export type StatusKegiatan = 'BERLANGSUNG' | 'TERJADWAL' | 'SELESAI' | 'TANPA_KEGIATAN';

const WIB_MS = 7 * 60 * 60 * 1000;
const HARI_MS = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export function batasRentang(rentang: Rentang, now = Date.now()) {
  const w = new Date(now + WIB_MS);
  if (rentang === 'hari') {
    const t = fmt(w);
    return { dari: t, sampai: t };
  }
  if (rentang === 'minggu') {
    const hariKe = (w.getUTCDay() + 6) % 7; // Senin = 0
    const senin = new Date(w.getTime() - hariKe * HARI_MS);
    return { dari: fmt(senin), sampai: fmt(new Date(senin.getTime() + 6 * HARI_MS)) };
  }
  const awal = new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), 1));
  const akhir = new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth() + 1, 0));
  return { dari: fmt(awal), sampai: fmt(akhir) };
}

const dalamRentang = (tanggal: string, b: { dari: string; sampai: string }) =>
  tanggal >= b.dari && tanggal <= b.sampai;

const cocokLab = (s: Sesi, lab: Lab) =>
  s.labId
    ? s.labId === lab.id
    : s.lab.trim().toLowerCase() === lab.nama.trim().toLowerCase();

export type RingkasanLab = {
  lab: Lab;
  jumlahPraktikan: number;
  status: StatusKegiatan;
  berlangsung: Sesi[];
  akanDatang: Sesi[];
  selesai: Sesi[];
};

export type BarisDenda = {
  tagihan: Tagihan;
  namaPraktikan: string;
  namaSesi: string;
};

export type Keuangan = {
  baris: BarisDenda[];
  totalTerbayar: number;
  totalTertunggak: number;
};

export type RingkasanDashboard = {
  jumlahLab: number;
  jumlahPraktikan: number;
  perLab: RingkasanLab[];
  berlangsung: Sesi[];
  akanDatang: Sesi[];
  riwayatKegiatan: Sesi[];
  keuangan: Keuangan;
};

type Input = {
  rentang: Rentang;
  labs: Lab[];
  sesi: Sesi[];
  users: User[];
  keanggotaanLab: Keanggotaan[];
  tagihan: Tagihan[];
  now?: number;
};

function praktikanPerLab(i: Input, lab: Lab): Set<string> {
  if (i.keanggotaanLab.length > 0) {
    return new Set(
      i.keanggotaanLab
        .filter((k) => k.labId === lab.id && k.peran === 'praktikan')
        .map((k) => k.uid),
    );
  }
  // Fallback sementara selama keanggotaanLab masih stub: pakai kelas dari sesi lab
  const kelas = new Set(i.sesi.filter((s) => cocokLab(s, lab)).map((s) => s.kelas));
  return new Set(
    i.users
      .filter((u) => u.peran === 'praktikan' && u.kelas && kelas.has(u.kelas))
      .map((u) => u.id),
  );
}

function bagianKeuangan(i: Input, batas: { dari: string; sampai: string }): Keuangan {
  const labIds = new Set(i.labs.map((l) => l.id));
  const baris: BarisDenda[] = i.tagihan
    .filter(
      (t) =>
        labIds.has(t.labId) &&
        dalamRentang(String(t.dibuatPada).slice(0, 10), batas),
    )
    .map((t) => ({
      tagihan: t,
      namaPraktikan: i.users.find((u) => u.id === t.praktikanId)?.nama ?? t.praktikanId,
      namaSesi: i.sesi.find((s) => s.id === t.sesiId)?.namaPraktikum ?? t.sesiId,
    }));

  const jumlah = (cek: (s: string) => boolean) =>
    baris.filter((b) => cek(b.tagihan.status)).reduce((n, b) => n + b.tagihan.nominal, 0);

  return {
    baris,
    totalTerbayar: jumlah((s) => s === 'PAID'),
    // DIBEBASKAN tidak dihitung sebagai tunggakan
    totalTertunggak: jumlah((s) => s === 'UNPAID' || s === 'PENDING' || s === 'FAILED'),
  };
}

export function hitungRingkasan(i: Input): RingkasanDashboard {
  const now = i.now ?? Date.now();
  const batas = batasRentang(i.rentang, now);
  const praktikanUnik = new Set<string>();

  const perLab: RingkasanLab[] = i.labs.map((lab) => {
    const sesiLab = i.sesi.filter((s) => cocokLab(s, lab) && dalamRentang(s.tanggal, batas));
    const berlangsung = sesiLab.filter((s) => getStatusEfektif(s, now) === 'DIBUKA');
    const akanDatang = sesiLab.filter((s) => getStatusEfektif(s, now) === 'TERJADWAL');
    const selesai = sesiLab.filter((s) => getStatusEfektif(s, now) === 'SELESAI');

    const anggota = praktikanPerLab(i, lab);
    anggota.forEach((uid) => praktikanUnik.add(uid));

    const status: StatusKegiatan = berlangsung.length
      ? 'BERLANGSUNG'
      : akanDatang.length
        ? 'TERJADWAL'
        : selesai.length
          ? 'SELESAI'
          : 'TANPA_KEGIATAN';

    return { lab, jumlahPraktikan: anggota.size, status, berlangsung, akanDatang, selesai };
  });

  const urut = (a: Sesi, b: Sesi) =>
    `${a.tanggal}${a.jamMulai}`.localeCompare(`${b.tanggal}${b.jamMulai}`);

  return {
    jumlahLab: i.labs.length,
    jumlahPraktikan: praktikanUnik.size, // unik lintas lab
    perLab,
    berlangsung: perLab.flatMap((l) => l.berlangsung).sort(urut),
    akanDatang: perLab.flatMap((l) => l.akanDatang).sort(urut),
    riwayatKegiatan: perLab.flatMap((l) => l.selesai).sort((a, b) => urut(b, a)),
    keuangan: bagianKeuangan(i, batas),
  };
}