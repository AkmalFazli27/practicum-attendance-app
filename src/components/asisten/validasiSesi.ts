import i18n from '@/i18n';

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

export type JadwalAwal = {
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
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

function hariIniLokal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Jam selesai (WIB) sudah lewat dari sekarang. */
function sudahBerakhir(tanggal: string, jamSelesai: string): boolean {
  return Date.now() > new Date(`${tanggal}T${jamSelesai}:00+07:00`).getTime();
}

/**
 * @param jadwalAwal jadwal sesi yang sedang diubah (mode edit). Jadwal yang
 *   sudah lampau hanya diizinkan bila tidak diubah dari jadwal awal ini.
 */
export function validasiFormSesi(
  f: FormSesiMentah,
  jadwalAwal?: JadwalAwal,
): HasilValidasi {
  const namaPraktikum = f.namaPraktikum.trim();
  const kelas = f.kelas.trim().toUpperCase();
  const lab = f.lab.trim();
  const tanggal = f.tanggal.trim();

  if (!namaPraktikum) return { ok: false, pesan: i18n.t('asprak.valNameRequired') };
  if (namaPraktikum.length > 80) {
    return { ok: false, pesan: i18n.t('asprak.valNameMax') };
  }
  if (!kelas) return { ok: false, pesan: i18n.t('asprak.valClassRequired') };
  if (!lab) return { ok: false, pesan: i18n.t('asprak.valLabRequired') };
  if (!tanggal) return { ok: false, pesan: i18n.t('asprak.valDateRequired') };
  if (!tanggalValid(tanggal)) {
    return {
      ok: false,
      pesan: i18n.t('asprak.valDateInvalid'),
    };
  }

  if (tanggal < hariIniLokal() && tanggal !== jadwalAwal?.tanggal) {
    return {
      ok: false,
      pesan: i18n.t('asprak.valDatePast'),
    };
  }

  const jamMulai = normalisasiJam(f.jamMulai);
  const jamSelesai = normalisasiJam(f.jamSelesai);
  if (!f.jamMulai.trim() || !f.jamSelesai.trim()) {
    return { ok: false, pesan: i18n.t('asprak.valTimeRequired') };
  }
  if (!jamMulai || !jamSelesai) {
    return {
      ok: false,
      pesan: i18n.t('asprak.valTimeInvalid'),
    };
  }
  if (jamMulai < '07:00' || jamSelesai > '20:00') {
    return {
      ok: false,
      pesan: i18n.t('asprak.valTimeOperational'),
    };
  }
  if (jamSelesai <= jamMulai) {
    return { ok: false, pesan: i18n.t('asprak.valEndAfterStart') };
  }

  const jadwalBerubah =
    !jadwalAwal ||
    jadwalAwal.tanggal !== tanggal ||
    normalisasiJam(jadwalAwal.jamMulai) !== jamMulai ||
    normalisasiJam(jadwalAwal.jamSelesai) !== jamSelesai;
  if (jadwalBerubah && sudahBerakhir(tanggal, jamSelesai)) {
    return {
      ok: false,
      pesan: i18n.t('asprak.valSchedulePast'),
    };
  }

  const kapasitasMentah = f.kapasitas.trim();
  if (!/^\d+$/.test(kapasitasMentah)) {
    return { ok: false, pesan: i18n.t('asprak.valCapInt') };
  }
  const kapasitas = Number(kapasitasMentah);
  if (kapasitas < 1 || kapasitas > KAPASITAS_MAKS) {
    return { ok: false, pesan: i18n.t('asprak.valCapRange', { max: KAPASITAS_MAKS }) };
  }

  const deskripsi = f.deskripsi.trim();
  if (deskripsi.length > 500) {
    return { ok: false, pesan: i18n.t('asprak.valDescMax') };
  }

  return {
    ok: true,
    data: {
      namaPraktikum,
      topik: f.topik.trim() || i18n.t('asprak.defaultTopic'),
      kelas,
      lab,
      tanggal,
      jamMulai,
      jamSelesai,
      kapasitas,
      deskripsi:
        deskripsi ||
        i18n.t('asprak.defaultDesc', { nama: namaPraktikum, kelas }),
    },
  };
}