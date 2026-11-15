export type FormSesiMentah = {
  namaPraktikum: string;
  topik: string;
  kelas: string;
  lab: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  kapasitas: string;
  deskripsi: string;
};

export type SesiTervalidasi = {
  namaPraktikum: string;
  topik: string;
  kelas: string;
  lab: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  kapasitas: number;
  deskripsi: string;
};

export type HasilValidasi =
  | { ok: true; data: SesiTervalidasi }
  | { ok: false; pesan: string };

const KAPASITAS_MAKS = 500;

/** Tanggal kalender nyata (menolak 2026-02-31 atau 2026-13-01). */
export function tanggalValid(tanggal: string): boolean {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggal);
  if (!cocok) return false;
  const [tahun, bulan, hari] = [Number(cocok[1]), Number(cocok[2]), Number(cocok[3])];
  const d = new Date(tahun, bulan - 1, hari);
  return (
    d.getFullYear() === tahun &&
    d.getMonth() === bulan - 1 &&
    d.getDate() === hari
  );
}

/** "8.00" / "08:00" -> "08:00"; null bila bukan jam 00:00-23:59. */
export function normalisasiJam(jam: string): string | null {
  const cocok = /^(\d{1,2})[:.](\d{2})$/.exec(jam.trim());
  if (!cocok) return null;
  const jamAngka = Number(cocok[1]);
  const menit = Number(cocok[2]);
  if (jamAngka > 23 || menit > 59) return null;
  return `${String(jamAngka).padStart(2, '0')}:${String(menit).padStart(2, '0')}`;
}

export function validasiFormSesi(f: FormSesiMentah): HasilValidasi {
  const namaPraktikum = f.namaPraktikum.trim();
  const kelas = f.kelas.trim().toUpperCase();
  const lab = f.lab.trim();
  const tanggal = f.tanggal.trim();

  if (!namaPraktikum) return { ok: false, pesan: 'Nama praktikum wajib diisi.' };
  if (namaPraktikum.length > 80) {
    return { ok: false, pesan: 'Nama praktikum maksimal 80 karakter.' };
  }
  if (!kelas) return { ok: false, pesan: 'Kelas wajib diisi.' };
  if (!lab) return { ok: false, pesan: 'Laboratorium wajib diisi.' };
  if (!tanggal) return { ok: false, pesan: 'Tanggal wajib diisi.' };
  if (!tanggalValid(tanggal)) {
    return {
      ok: false,
      pesan: 'Tanggal tidak valid. Gunakan format YYYY-MM-DD, contoh 2026-11-20.',
    };
  }

  const jamMulai = normalisasiJam(f.jamMulai);
  const jamSelesai = normalisasiJam(f.jamSelesai);
  if (!f.jamMulai.trim() || !f.jamSelesai.trim()) {
    return { ok: false, pesan: 'Jam mulai dan jam selesai wajib diisi.' };
  }
  if (!jamMulai || !jamSelesai) {
    return {
      ok: false,
      pesan: 'Format jam tidak valid. Gunakan HH:mm antara 00:00 dan 23:59, contoh 08:00.',
    };
  }
  if (jamSelesai <= jamMulai) {
    return { ok: false, pesan: 'Jam selesai harus lebih akhir dari jam mulai.' };
  }

  const kapasitasMentah = f.kapasitas.trim();
  if (!/^\d+$/.test(kapasitasMentah)) {
    return { ok: false, pesan: 'Kapasitas harus berupa angka bulat.' };
  }
  const kapasitas = Number(kapasitasMentah);
  if (kapasitas < 1 || kapasitas > KAPASITAS_MAKS) {
    return { ok: false, pesan: `Kapasitas harus antara 1 dan ${KAPASITAS_MAKS}.` };
  }

  const deskripsi = f.deskripsi.trim();
  if (deskripsi.length > 500) {
    return { ok: false, pesan: 'Deskripsi maksimal 500 karakter.' };
  }

  return {
    ok: true,
    data: {
      namaPraktikum,
      topik: f.topik.trim() || 'Materi Praktikum',
      kelas,
      lab,
      tanggal,
      jamMulai,
      jamSelesai,
      kapasitas,
      deskripsi:
        deskripsi || `Pertemuan praktikum ${namaPraktikum} untuk kelas ${kelas}.`,
    },
  };
}
