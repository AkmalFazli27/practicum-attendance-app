import type {
  Keanggotaan,
  Lab,
  Sesi,
  StatusSesi,
  Tagihan,
  User,
} from '@/data/dummy';
import { dalamRentang, hitungRentang, tanggalWib } from './rentang';
import type { Rentang } from './rentang';
import { getStatusEfektif } from './statusSesi';

export type StatusKegiatanLab =
  | 'BERLANGSUNG'
  | 'TERJADWAL'
  | 'SELESAI'
  | 'TANPA_KEGIATAN';

export type KegiatanLab = {
  sesiId: string;
  namaPraktikum: string;
  kelas: string;
  labId: string;
  lab: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  status: StatusSesi;
};

export type RingkasanLabItem = {
  lab: Lab;
  lokasi: string;
  jumlahPraktikan: number;
  jumlahAsprak: number;
  status: StatusKegiatanLab;
  /** Kegiatan lab ini di dalam rentang filter, terurut waktu. */
  kegiatan: KegiatanLab[];
};

export type BarisKeuangan = {
  tagihanId: string;
  praktikanId: string;
  praktikan: string;
  sesiId: string;
  namaSesi: string;
  labId: string;
  nominal: number;
  status: Tagihan['status'];
  tanggal: string;
};

export type RingkasanLab = {
  rentang: Rentang;
  mulai: string;
  selesai: string;
  jumlahLab: number;
  jumlahPraktikan: number;
  lab: RingkasanLabItem[];
  /** Sesi yang sedang dibuka (tidak terpengaruh filter, selalu "sekarang"). */
  berlangsung: KegiatanLab[];
  /** Sesi terjadwal di dalam rentang filter. */
  akanDatang: KegiatanLab[];
  /** Sesi selesai di dalam rentang filter, terbaru dahulu. */
  riwayatKegiatan: KegiatanLab[];
  keuangan: {
    baris: BarisKeuangan[];
    totalTerbayar: number;
    totalTertunggak: number;
    totalDibebaskan: number;
  };
};

export type ParamRingkasanLab = {
  rentang: Rentang;
  labs: Lab[];
  sesi: Sesi[];
  keanggotaan: Keanggotaan[];
  tagihan: Tagihan[];
  users: Pick<User, 'id' | 'nama'>[];
  /** Bila diisi, hanya lab milik aslab ini (atau lab tanpa pemilik) yang dihitung. */
  aslabId?: string;
  now?: number;
};

const kunci = (k: KegiatanLab) => `${k.tanggal} ${k.jamMulai}`;
const naik = (a: KegiatanLab, b: KegiatanLab) => kunci(a).localeCompare(kunci(b));
const turun = (a: KegiatanLab, b: KegiatanLab) => kunci(b).localeCompare(kunci(a));

function tanggalDariIso(iso: string): string {
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? '' : tanggalWib(ms);
}

export function hitungRingkasanLab(p: ParamRingkasanLab): RingkasanLab {
  const now = p.now ?? Date.now();
  const batas = hitungRentang(p.rentang, now);

  const labs = p.labs.filter(
    (l) => !p.aslabId || !l.aslabId || l.aslabId === p.aslabId,
  );
  const idLab = new Set(labs.map((l) => l.id));
  const anggota = p.keanggotaan.filter((k) => idLab.has(k.labId));

  const semua: KegiatanLab[] = p.sesi
    .filter((s) => !!s.labId && idLab.has(s.labId))
    .map((s) => ({
      sesiId: s.id,
      namaPraktikum: s.namaPraktikum,
      kelas: s.kelas,
      labId: s.labId as string,
      lab: s.lab,
      tanggal: s.tanggal,
      jamMulai: s.jamMulai,
      jamSelesai: s.jamSelesai,
      status: getStatusEfektif(s, now),
    }));

  const dalam = semua.filter((k) => dalamRentang(k.tanggal, batas));
  const berlangsung = semua.filter((k) => k.status === 'DIBUKA').sort(naik);
  const akanDatang = dalam.filter((k) => k.status === 'TERJADWAL').sort(naik);
  const riwayatKegiatan = dalam.filter((k) => k.status === 'SELESAI').sort(turun);

  const lab: RingkasanLabItem[] = labs.map((l) => {
    const kegiatan = dalam.filter((k) => k.labId === l.id).sort(naik);
    const sedangBerlangsung = berlangsung.some((k) => k.labId === l.id);
    let status: StatusKegiatanLab = 'TANPA_KEGIATAN';
    if (sedangBerlangsung) status = 'BERLANGSUNG';
    else if (kegiatan.some((k) => k.status === 'TERJADWAL')) status = 'TERJADWAL';
    else if (kegiatan.some((k) => k.status === 'SELESAI')) status = 'SELESAI';
    const milikLab = anggota.filter((k) => k.labId === l.id);
    return {
      lab: l,
      lokasi: l.alamat,
      jumlahPraktikan: new Set(
        milikLab.filter((k) => k.peran === 'praktikan').map((k) => k.uid),
      ).size,
      jumlahAsprak: new Set(
        milikLab.filter((k) => k.peran === 'asprak').map((k) => k.uid),
      ).size,
      status,
      kegiatan,
    };
  });

  const namaUser = new Map(p.users.map((u) => [u.id, u.nama]));
  const namaSesi = new Map(p.sesi.map((s) => [s.id, s.namaPraktikum]));
  const baris: BarisKeuangan[] = p.tagihan
    .filter(
      (t) =>
        idLab.has(t.labId) && dalamRentang(tanggalDariIso(t.dibuatPada), batas),
    )
    .map((t) => ({
      tagihanId: t.id,
      praktikanId: t.praktikanId,
      praktikan: namaUser.get(t.praktikanId) ?? t.praktikanId,
      sesiId: t.sesiId,
      namaSesi: namaSesi.get(t.sesiId) ?? t.sesiId,
      labId: t.labId,
      nominal: t.nominal,
      status: t.status,
      tanggal: tanggalDariIso(t.dibuatPada),
    }))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const jumlah = (f: (b: BarisKeuangan) => boolean) =>
    baris.filter(f).reduce((n, b) => n + b.nominal, 0);

  return {
    rentang: p.rentang,
    mulai: batas.mulai,
    selesai: batas.selesai,
    jumlahLab: labs.length,
    jumlahPraktikan: new Set(
      anggota.filter((k) => k.peran === 'praktikan').map((k) => k.uid),
    ).size,
    lab,
    berlangsung,
    akanDatang,
    riwayatKegiatan,
    keuangan: {
      baris,
      totalTerbayar: jumlah((b) => b.status === 'PAID'),
      totalTertunggak: jumlah(
        (b) => b.status === 'UNPAID' || b.status === 'PENDING' || b.status === 'FAILED',
      ),
      totalDibebaskan: jumlah((b) => b.status === 'DIBEBASKAN'),
    },
  };
}
