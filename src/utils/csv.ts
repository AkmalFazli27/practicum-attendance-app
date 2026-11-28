import Papa from 'papaparse';

import type { Lab } from '@/data/dummy';
import { koordinatValid } from './geo';

/**
 * Parser, validator, dan template CSV untuk tiga bulk insert (lab, praktikan, asprak).
 * Fungsi di sini murni (tanpa akses file/Firestore): pembacaan file dan unduhan template
 * dilakukan layar (expo-document-picker, expo-file-system, expo-sharing).
 */
export type JenisImpor = 'lab' | 'praktikan' | 'asprak';

/** Satu baris CSV; semua nilai berupa string agar dapat diubah di daftar review. */
export type BarisCsv = Record<string, string>;

export const MAKS_BARIS_CSV = 1000;

export const KOLOM_CSV: Record<JenisImpor, string[]> = {
  lab: ['nama', 'alamat', 'lat', 'lng', 'radius', 'graceMenit', 'dendaNominal'],
  praktikan: ['nim', 'email'],
  asprak: ['nim', 'email'],
};

const KOLOM_WAJIB: Record<JenisImpor, string[]> = {
  lab: ['nama', 'lat', 'lng', 'radius'],
  praktikan: [],
  asprak: [],
};

const ALIAS: Record<string, string> = {
  namalab: 'nama',
  latitude: 'lat',
  longitude: 'lng',
  lon: 'lng',
  long: 'lng',
  grace: 'graceMenit',
  gracemenit: 'graceMenit',
  graceperiod: 'graceMenit',
  denda: 'dendaNominal',
  dendanominal: 'dendaNominal',
  nominaldenda: 'dendaNominal',
};

const normalisasiHeader = (h: string): string => {
  const k = h.replace(/^\uFEFF/, '').toLowerCase().replace(/[\s_\-]/g, '');
  return ALIAS[k] ?? k;
};

export type HasilParseCsv =
  | { ok: true; baris: BarisCsv[] }
  | { ok: false; alasan: string };

export function parseCsv(jenis: JenisImpor, teks: string): HasilParseCsv {
  const isi = (teks ?? '').replace(/^\uFEFF/, '').trim();
  if (!isi) return { ok: false, alasan: 'File CSV kosong.' };

  const hasil = Papa.parse<Record<string, unknown>>(isi, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: normalisasiHeader,
  });

  if (hasil.errors.some((e) => e.type === 'Quotes')) {
    return { ok: false, alasan: 'Format CSV rusak (tanda kutip tidak seimbang).' };
  }

  const kolomAda = new Set(hasil.meta.fields ?? []);
  const hilang = KOLOM_WAJIB[jenis].filter((k) => !kolomAda.has(k));
  if (hilang.length > 0) {
    return {
      ok: false,
      alasan: `Kolom wajib tidak ditemukan: ${hilang.join(', ')}. Unduh template untuk format yang benar.`,
    };
  }
  if (jenis !== 'lab' && !kolomAda.has('nim') && !kolomAda.has('email')) {
    return {
      ok: false,
      alasan: 'Kolom nim atau email tidak ditemukan. Unduh template untuk format yang benar.',
    };
  }

  const baris = hasil.data
    .map((row) => {
      const out: BarisCsv = {};
      for (const k of KOLOM_CSV[jenis]) out[k] = String(row[k] ?? '').trim();
      return out;
    })
    .filter((row) => Object.values(row).some((v) => v !== ''));

  if (baris.length === 0) {
    return { ok: false, alasan: 'File CSV tidak berisi baris data.' };
  }
  if (baris.length > MAKS_BARIS_CSV) {
    return {
      ok: false,
      alasan: `Maksimal ${MAKS_BARIS_CSV} baris per file. File ini berisi ${baris.length} baris.`,
    };
  }
  return { ok: true, baris };
}

const RE_EMAIL = /^\S+@\S+\.\S+$/;

const angka = (s: string | undefined): number => {
  const t = (s ?? '').trim();
  return t === '' ? NaN : Number(t.replace(',', '.'));
};

/** Mengembalikan alasan penolakan, atau null bila baris valid. */
export function validasiBarisCsv(jenis: JenisImpor, b: BarisCsv): string | null {
  if (jenis === 'lab') {
    if (!(b.nama ?? '').trim()) return 'Nama lab wajib diisi.';
    const lat = angka(b.lat);
    const lng = angka(b.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !koordinatValid({ lat, lng })) {
      return 'Koordinat tidak valid.';
    }
    if (!(angka(b.radius) > 0)) return 'Radius harus lebih dari 0.';
    if ((b.graceMenit ?? '').trim() !== '') {
      const g = angka(b.graceMenit);
      if (!Number.isInteger(g) || g < 0 || g > 60) {
        return 'Grace period harus bilangan bulat 0-60 menit.';
      }
    }
    if ((b.dendaNominal ?? '').trim() !== '') {
      const d = angka(b.dendaNominal);
      if (!Number.isInteger(d) || d <= 0) {
        return 'Nominal denda harus bilangan bulat lebih dari 0.';
      }
    }
    return null;
  }
  const nim = (b.nim ?? '').trim();
  const email = (b.email ?? '').trim();
  if (!nim && !email) return 'NIM atau email wajib diisi.';
  if (email && !RE_EMAIL.test(email)) return 'Format email tidak valid.';
  return null;
}

/** Hanya dipanggil untuk baris yang lolos validasiBarisCsv('lab', ...). */
export function keInputLab(b: BarisCsv, mataKuliah: string): Omit<Lab, 'id'> {
  const grace = (b.graceMenit ?? '').trim();
  const denda = (b.dendaNominal ?? '').trim();
  return {
    nama: (b.nama ?? '').trim(),
    alamat: (b.alamat ?? '').trim(),
    mataKuliah: mataKuliah.trim(),
    lat: angka(b.lat),
    lng: angka(b.lng),
    radius: angka(b.radius),
    ...(grace ? { graceMenit: angka(grace) } : {}),
    ...(denda ? { dendaNominal: angka(denda) } : {}),
  };
}

export function keBarisAnggota(b: BarisCsv): { nim?: string; email?: string } {
  const nim = (b.nim ?? '').trim();
  const email = (b.email ?? '').trim();
  return { ...(nim ? { nim } : {}), ...(email ? { email } : {}) };
}

const CONTOH: Record<JenisImpor, string[]> = {
  lab: ['Lab Pemrograman 1', 'Gedung E lantai 2', '-7.0482', '110.4407', '50', '15', '5000'],
  praktikan: ['2310512001', 'nama@contoh.ac.id'],
  asprak: ['2210512001', 'nama@contoh.ac.id'],
};

/** Isi file template. Satu baris contoh disertakan; hapus sebelum mengunggah. */
export function buatTemplateCsv(jenis: JenisImpor, denganContoh = true): string {
  const baris = [KOLOM_CSV[jenis].join(',')];
  if (denganContoh) baris.push(CONTOH[jenis].join(','));
  return baris.join('\r\n') + '\r\n';
}
