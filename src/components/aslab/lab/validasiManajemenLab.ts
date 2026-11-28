import type { Keanggotaan, Lab, User } from '@/data/dummy';
import { koordinatValid, type Titik } from '@/utils/geo';

export const DEFAULT_RADIUS_LAB = 100;
export const DEFAULT_GRACE_MENIT = 15;
export const DEFAULT_DENDA_NOMINAL = 5000;
export const DEFAULT_JUMLAH_PERTEMUAN = 8;

export type KodeValidasiFormLab =
  | 'valNamaKosong'
  | 'valMkKosong'
  | 'valAlamatKosong'
  | 'valTitikKosong'
  | 'valKoordinatInvalid'
  | 'valRadiusInvalid'
  | 'valGraceInvalid'
  | 'valDendaInvalid'
  | 'valPertemuanInvalid';

export interface DrafFormLab {
  nama: string;
  mataKuliah: string;
  alamat: string;
  titik: Titik | null;
  radiusTeks: string;
  graceTeks: string;
  dendaTeks: string;
  pertemuanTeks?: string;
}

export function parseAngkaPositif(teks: string): number | null {
  const bersih = teks.trim().replace(',', '.');
  if (!bersih) return null;
  if (!/^-?\d+(\.\d+)?$/.test(bersih)) return null;
  const n = Number(bersih);
  return Number.isFinite(n) ? n : null;
}

export function parseBulatNonNegatif(teks: string): number | null {
  const bersih = teks.trim();
  if (!bersih) return null;
  if (!/^-?\d+$/.test(bersih)) return null;
  const n = Number(bersih);
  return Number.isInteger(n) ? n : null;
}

export function validasiFormLab(draf: DrafFormLab): {
  errors: KodeValidasiFormLab[];
  radius: number;
  graceMenit: number;
  dendaNominal: number;
  jumlahPertemuan: number;
} {
  const errors: KodeValidasiFormLab[] = [];
  if (draf.nama.trim().length < 2) {
    errors.push('valNamaKosong');
  }
  if (!draf.mataKuliah.trim()) {
    errors.push('valMkKosong');
  }
  if (draf.alamat.trim().length < 3) {
    errors.push('valAlamatKosong');
  }
  if (!draf.titik) {
    errors.push('valTitikKosong');
  } else if (
    !koordinatValid(draf.titik) ||
    (draf.titik.lat === 0 && draf.titik.lng === 0)
  ) {
    errors.push('valKoordinatInvalid');
  }

  const radius = parseAngkaPositif(draf.radiusTeks);
  if (radius === null || radius <= 0) {
    errors.push('valRadiusInvalid');
  }

  const grace = parseBulatNonNegatif(draf.graceTeks);
  if (grace === null || grace < 0 || grace > 60) {
    errors.push('valGraceInvalid');
  }

  const denda = parseAngkaPositif(draf.dendaTeks);
  if (denda === null || denda <= 0) {
    errors.push('valDendaInvalid');
  }

  const pertemuanRaw =
    draf.pertemuanTeks !== undefined
      ? parseBulatNonNegatif(draf.pertemuanTeks)
      : DEFAULT_JUMLAH_PERTEMUAN;
  if (pertemuanRaw === null || pertemuanRaw < 1 || pertemuanRaw > 20) {
    errors.push('valPertemuanInvalid');
  }

  return {
    errors,
    radius: radius ?? Number.NaN,
    graceMenit: grace ?? Number.NaN,
    dendaNominal: denda ? Math.round(denda) : Number.NaN,
    jumlahPertemuan: pertemuanRaw ?? DEFAULT_JUMLAH_PERTEMUAN,
  };
}

export type StatusBarisReview =
  | 'valid'
  | 'invalid'
  | 'duplikat'
  | 'belum-terdaftar';

export interface BarisReviewLab {
  id: string;
  nomorBaris: number;
  diterima: boolean;
  nama: string;
  alamat: string;
  lat: string;
  lng: string;
  radius: string;
  graceMenit: string;
  dendaNominal: string;
}

export interface EvaluasiBarisLab {
  status: StatusBarisReview;
  alasan: KodeValidasiFormLab[];
  payload: Omit<Lab, 'id'> | null;
}

export function evaluasiBarisLab(
  baris: BarisReviewLab,
  semuaBaris: BarisReviewLab[],
  mataKuliah: string,
  existingLabs: Lab[],
  aslabId?: string,
): EvaluasiBarisLab {
  const mk = mataKuliah.trim();
  const latNum = parseAngkaPositif(baris.lat);
  const lngNum = parseAngkaPositif(baris.lng);
  const titik =
    latNum !== null && lngNum !== null ? { lat: latNum, lng: lngNum } : null;

  const cek = validasiFormLab({
    nama: baris.nama,
    mataKuliah: mk,
    alamat: baris.alamat,
    titik,
    radiusTeks: baris.radius,
    graceTeks: baris.graceMenit,
    dendaTeks: baris.dendaNominal,
  });

  if (cek.errors.length > 0 || !titik) {
    return { status: 'invalid', alasan: cek.errors, payload: null };
  }

  const norm = (s: string) => s.trim().toLowerCase();
  const kunciNama = norm(baris.nama);
  const kunciMk = norm(mk);

  const duplikatExisting = existingLabs.some(
    (l) => norm(l.nama) === kunciNama && norm(l.mataKuliah ?? '') === kunciMk,
  );
  const idxPertamaBatch = semuaBaris.findIndex(
    (b) => norm(b.nama) === kunciNama,
  );
  const idxSaya = semuaBaris.findIndex((b) => b.id === baris.id);
  const duplikatBatch = idxPertamaBatch !== -1 && idxPertamaBatch < idxSaya;

  if (duplikatExisting || duplikatBatch) {
    return { status: 'duplikat', alasan: [], payload: null };
  }

  return {
    status: 'valid',
    alasan: [],
    payload: {
      nama: baris.nama.trim(),
      mataKuliah: mk,
      alamat: baris.alamat.trim(),
      lat: titik.lat,
      lng: titik.lng,
      radius: cek.radius,
      graceMenit: cek.graceMenit,
      dendaNominal: cek.dendaNominal,
      aslabId,
    },
  };
}

export interface BarisReviewAnggota {
  id: string;
  nomorBaris: number;
  diterima: boolean;
  nim: string;
  email: string;
  nama: string;
}

export interface EvaluasiBarisAnggota {
  status: StatusBarisReview;
  alasanKode:
    | 'valNimEmailKosong'
    | 'valEmailInvalid'
    | 'valNimInvalid'
    | 'memberRoleMismatch'
    | 'memberRoleConflictCourse'
    | null;
  matchedUser: User | null;
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_NIM = /^\d{6,20}$/;

export function cariUserTerdaftar(
  users: User[],
  nimInput: string,
  emailInput: string,
): User | null {
  const nim = nimInput.trim();
  const email = emailInput.trim().toLowerCase();
  if (email) {
    const byEmail = users.find((u) => (u.email ?? '').trim().toLowerCase() === email);
    if (byEmail) return byEmail;
  }
  if (nim) {
    const byNim = users.find((u) => (u.nim ?? '').trim() === nim);
    if (byNim) return byNim;
  }
  return null;
}

/**
 * Memeriksa apakah user (atau akun lain dengan NIM sama) sudah terdaftar dengan
 * peran berlawanan (Asprak vs Praktikan) pada lab atau mata kuliah yang sama.
 */
export function adaKonflikPeranMatkul(
  user: User,
  labTarget: Lab | null,
  peranTarget: Keanggotaan['peran'],
  users: User[],
  keanggotaanLab: Keanggotaan[],
): boolean {
  if (!labTarget) return false;
  const uidSet = new Set<string>([user.id]);
  const userNim = (user.nim ?? '').trim();
  if (userNim) {
    for (const u of users) {
      if ((u.nim ?? '').trim() === userNim) {
        uidSet.add(u.id);
      }
    }
  }
  const mkTarget = (labTarget.mataKuliah ?? '').trim().toLowerCase();

  return keanggotaanLab.some((k) => {
    if (!uidSet.has(k.uid)) return false;
    if (k.peran === peranTarget) return false;
    if (k.labId === labTarget.id) return true;
    const mkAnggota = (k.mataKuliah ?? '').trim().toLowerCase();
    return Boolean(mkTarget && mkAnggota && mkTarget === mkAnggota);
  });
}

export function evaluasiBarisAnggota(
  baris: BarisReviewAnggota,
  semuaBaris: BarisReviewAnggota[],
  labTarget: Lab | null,
  peranTarget: Keanggotaan['peran'],
  users: User[],
  keanggotaanLab: Keanggotaan[],
): EvaluasiBarisAnggota {
  const nim = baris.nim.trim();
  const email = baris.email.trim().toLowerCase();

  if (!nim && !email) {
    return {
      status: 'invalid',
      alasanKode: 'valNimEmailKosong',
      matchedUser: null,
    };
  }
  if (email && !RE_EMAIL.test(email)) {
    return {
      status: 'invalid',
      alasanKode: 'valEmailInvalid',
      matchedUser: null,
    };
  }
  if (nim && !RE_NIM.test(nim)) {
    return {
      status: 'invalid',
      alasanKode: 'valNimInvalid',
      matchedUser: null,
    };
  }

  // Cek duplikat di dalam batch CSV yang sama
  const idxSaya = semuaBaris.findIndex((b) => b.id === baris.id);
  const duplikatBatch = semuaBaris.some((b, idx) => {
    if (idx >= idxSaya) return false;
    const bNim = b.nim.trim();
    const bEmail = b.email.trim().toLowerCase();
    return (nim && bNim === nim) || (email && bEmail === email);
  });
  if (duplikatBatch) {
    return { status: 'duplikat', alasanKode: null, matchedUser: null };
  }

  // Cek apakah NIM/email sudah terdaftar di koleksi users
  if (users.length > 0) {
    const user = cariUserTerdaftar(users, nim, email);
    if (!user) {
      return { status: 'belum-terdaftar', alasanKode: null, matchedUser: null };
    }
    const peranAkunSesuai =
      peranTarget === 'praktikan'
        ? user.peran === 'praktikan'
        : user.peran === 'asisten';
    if (!peranAkunSesuai) {
      return {
        status: 'invalid',
        alasanKode: 'memberRoleMismatch',
        matchedUser: user,
      };
    }

    if (
      adaKonflikPeranMatkul(
        user,
        labTarget,
        peranTarget,
        users,
        keanggotaanLab,
      )
    ) {
      return {
        status: 'invalid',
        alasanKode: 'memberRoleConflictCourse',
        matchedUser: user,
      };
    }

    if (labTarget) {
      const sudahDiLab = keanggotaanLab.some(
        (k) => k.labId === labTarget.id && k.uid === user.id,
      );
      // Satu praktikan hanya boleh 1 lab aktif per mata kuliah (§2.2)
      const sudahDiMkSama =
        peranTarget === 'praktikan' &&
        Boolean(labTarget.mataKuliah?.trim()) &&
        keanggotaanLab.some(
          (k) =>
            k.uid === user.id &&
            k.peran === 'praktikan' &&
            k.mataKuliah.trim().toLowerCase() ===
              (labTarget.mataKuliah ?? '').trim().toLowerCase(),
        );
      if (sudahDiLab || sudahDiMkSama) {
        return { status: 'duplikat', alasanKode: null, matchedUser: user };
      }
    }

    return { status: 'valid', alasanKode: null, matchedUser: user };
  }

  return { status: 'valid', alasanKode: null, matchedUser: null };
}
