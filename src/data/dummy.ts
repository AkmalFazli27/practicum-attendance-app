export type Peran = 'asisten' | 'praktikan' | 'aslab';
export type StatusSesi = 'TERJADWAL' | 'DIBUKA' | 'SELESAI';
export type StatusIzin = 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';

export type User = {
  id: string;
  nama: string;
  email?: string;
  nim?: string;
  peran: Peran;
  kelas?: string;
  pushToken?: string;
};

export type Sesi = {
  id: string;
  namaPraktikum: string;
  topik?: string;
  kelas: string;
  lab: string;
  labId?: string;
  /** Format YYYY-MM-DD */
  tanggal: string;
  /** Format HH:mm */
  jamMulai: string;
  /** Format HH:mm */
  jamSelesai: string;
  asistenId: string;
  status: StatusSesi;
  deskripsi: string;
  kapasitas?: number;
  /** Token unik QR presensi yang berlaku terbatas (maks. 15 menit) */
  qrToken?: string;
  /** Epoch ms batas waktu berlaku QR (maks. 15 menit atau jam selesai sesi) */
  qrExpiresAt?: number;
};

export type SesiInput = {
  namaPraktikum: string;
  topik?: string;
  kelas: string;
  lab: string;
  labId?: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  deskripsi: string;
  kapasitas?: number;
};

export type Kehadiran = {
  id: string;
  sesiId: string;
  praktikanId: string;
  namaPraktikan?: string;
  nimPraktikan?: string;
  kelasPraktikan?: string;
  /** ISO string, diisi otomatis saat presensi */
  waktuHadir: string;
  lat?: number;
  lng?: number;
  jarak?: number;
  akurasi?: number;
  statusKehadiran?: 'TEPAT_WAKTU' | 'TERLAMBAT';
  menitTerlambat?: number;
  tagihanId?: string;
};

export type Izin = {
  id: string;
  sesiId: string;
  praktikanId: string;
  namaPraktikan?: string;
  nimPraktikan?: string;
  kelasPraktikan?: string;
  alasan: string;
  /** Prediksi kategori dari model AI (sebagai informasi pendukung asisten) */
  kategoriAi: string;
  ringkasanAi?: string;
  status: StatusIzin;
  waktuPengajuan: string;
  waktuKeputusan?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  sentimenAi?: string;
};

export type Lab = {
  id: string;
  nama: string;
  alamat: string;
  lat: number;
  lng: number;
  /** Radius presensi dalam meter */
  radius: number;
  mataKuliah?: string;
  aslabId?: string;
  graceMenit?: number;
  dendaNominal?: number;
};

export type Koordinat = {
  lat: number;
  lng: number;
  /** Akurasi GPS dalam meter */
  akurasi?: number;
};

export type AlasanTolak =
  | 'LUAR_RADIUS'
  | 'SUDAH_PRESENSI'
  | 'SESI_TIDAK_DIBUKA'
  | 'SESI_SUDAH_DITUTUP'
  | 'BELUM_WAKTUNYA'
  | 'WAKTU_HABIS'
  | 'KOORDINAT_TIDAK_ADA'
  | 'JARINGAN'
  | 'LAB_BELUM_DIATUR'
  | 'SUDAH_IZIN'
  | 'DI_LUAR_JAM_OPERASIONAL'
  | 'TIDAK_BERHAK';


export type HasilAksi =
  | { ok: true; jarak?: number; notifGagal?: boolean }
  | { ok: false; alasan: AlasanTolak };

export type Keanggotaan = {
  id: string; labId: string; uid: string;
  peran: 'praktikan' | 'asprak'; mataKuliah: string;
};
export type Tagihan = {
  id: string; praktikanId: string; sesiId: string; labId: string;
  kehadiranId: string; nominal: number; menitTerlambat: number;
  status: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'DIBEBASKAN';
  dibuatPada: string; dibayarPada?: string; izinId?: string;
};
export type Pembayaran = {
  id: string; tagihanId: string; praktikanId: string; nominal: number;
  status: 'pending' | 'success' | 'failed'; statusMidtrans: string;
  metode?: string; dibuatPada: string; diperbaruiPada: string;
};
export type HasilBulk = {
  berhasil: number; gagal: { baris: number; alasan: string }[];
};

const WIB_MS = 7 * 60 * 60 * 1000;
const HARI_MS = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

const tanggalOffset = (hari: number): string => {
  const d = new Date(Date.now() + WIB_MS + hari * HARI_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const jamOffset = (menit: number): string => {
  const d = new Date(Date.now() + WIB_MS);
  const total = d.getUTCHours() * 60 + d.getUTCMinutes() + menit;
  const c = Math.min(Math.max(total, 0), 23 * 60 + 59);
  return `${pad(Math.floor(c / 60))}:${pad(c % 60)}`;
};

const waktuWib = (tanggal: string, jam: string, detik = '00'): string =>
  `${tanggal}T${jam}:${detik}+07:00`;

const HARI_INI = tanggalOffset(0);
const KEMARIN = tanggalOffset(-1);
const DUA_HARI_LALU = tanggalOffset(-2);
const BESOK = tanggalOffset(1);
const LUSA = tanggalOffset(2);

export const USERS: User[] = [
  {
    id: 'a1',
    nama: 'Budi Santoso',
    email: 'budi.santoso@tapin.ac.id',
    nim: '2210512001',
    peran: 'asisten',
  },
  {
    id: 'a2',
    nama: 'Siti Rahma',
    email: 'siti.rahma@tapin.ac.id',
    nim: '2210512002',
    peran: 'asisten',
  },
  {
    id: 'p1',
    nama: 'Andi Pratama',
    email: 'andi.pratama@tapin.ac.id',
    nim: '2310512001',
    peran: 'praktikan',
    kelas: 'IF-2A',
  },
  {
    id: 'p2',
    nama: 'Bella Putri',
    email: 'bella.putri@tapin.ac.id',
    nim: '2310512002',
    peran: 'praktikan',
    kelas: 'IF-2A',
  },
  {
    id: 'p3',
    nama: 'Citra Dewi',
    email: 'citra.dewi@tapin.ac.id',
    nim: '2310512003',
    peran: 'praktikan',
    kelas: 'IF-2A',
  },
  {
    id: 'p4',
    nama: 'Dimas Saputra',
    email: 'dimas.saputra@tapin.ac.id',
    nim: '2310512004',
    peran: 'praktikan',
    kelas: 'IF-2A',
  },
  {
    id: 'p5',
    nama: 'Eka Lestari',
    email: 'eka.lestari@tapin.ac.id',
    nim: '2310512005',
    peran: 'praktikan',
    kelas: 'IF-2B',
  },
  {
    id: 'p6',
    nama: 'Fajar Nugroho',
    email: 'fajar.nugroho@tapin.ac.id',
    nim: '2310512006',
    peran: 'praktikan',
    kelas: 'IF-2B',
  },
  {
    id: 'p7',
    nama: 'Gita Maharani',
    email: 'gita.maharani@tapin.ac.id',
    nim: '2310512007',
    peran: 'praktikan',
    kelas: 'IF-2B',
  },
  {
    id: 'p8',
    nama: 'Hendra Wijaya',
    email: 'hendra.wijaya@tapin.ac.id',
    nim: '2310512008',
    peran: 'praktikan',
    kelas: 'IF-2B',
  },
];

export const SESI_SEED: Sesi[] = [
  {
    id: 'ses-1',
    namaPraktikum: 'Pemrograman Web',
    topik: 'React State & Event Handling',
    kelas: 'IF-2A',
    lab: 'Lab AP',
    labId: 'lab-ap',
    tanggal: HARI_INI,
    jamMulai: jamOffset(-30),
    jamSelesai: jamOffset(90),
    asistenId: 'a1',
    status: 'DIBUKA',
    deskripsi: 'Pertemuan 4: Layout responsif dengan flexbox dan komponen React.',
    kapasitas: 32,
  },
  {
    id: 'ses-2',
    namaPraktikum: 'Basis Data',
    topik: 'Query Lanjutan & Join',
    kelas: 'IF-2A',
    lab: 'Lab B',
    labId: 'lab-b',
    tanggal: BESOK,
    jamMulai: '10:15',
    jamSelesai: '12:15',
    asistenId: 'a1',
    status: 'TERJADWAL',
    deskripsi: 'Pertemuan 4: Normalisasi tabel dan relasi antar entitas.',
    kapasitas: 32,
  },
  {
    id: 'ses-3',
    namaPraktikum: 'Jaringan Komputer',
    topik: 'Konfigurasi Routing Dasar',
    kelas: 'IF-2B',
    lab: 'Lab C',
    labId: 'lab-c',
    tanggal: BESOK,
    jamMulai: '13:00',
    jamSelesai: '15:00',
    asistenId: 'a1',
    status: 'TERJADWAL',
    deskripsi: 'Pertemuan 3: Konfigurasi IP statis dan pengujian konektivitas.',
    kapasitas: 30,
  },
  {
    id: 'ses-4',
    namaPraktikum: 'Sistem Operasi',
    topik: 'Manajemen Proses Linux',
    kelas: 'IF-2B',
    lab: 'Lab D',
    labId: 'lab-d',
    tanggal: KEMARIN,
    jamMulai: '08:00',
    jamSelesai: '10:00',
    asistenId: 'a2',
    status: 'SELESAI',
    deskripsi: 'Pertemuan 3: Manajemen proses dan perintah dasar Linux.',
    kapasitas: 30,
  },
  {
    id: 'ses-5',
    namaPraktikum: 'Pemrograman Web',
    topik: 'Layout Responsif & Flexbox',
    kelas: 'IF-2B',
    lab: 'Lab AP',
    labId: 'lab-ap',
    tanggal: LUSA,
    jamMulai: '10:15',
    jamSelesai: '12:15',
    asistenId: 'a1',
    status: 'TERJADWAL',
    deskripsi: 'Pertemuan 4: Layout responsif dengan flexbox dan komponen React.',
    kapasitas: 32,
  },
  {
    id: 'ses-6',
    namaPraktikum: 'Basis Data',
    topik: 'Normalisasi & Relasi Entitas',
    kelas: 'IF-2A',
    lab: 'Lab B',
    labId: 'lab-b',
    tanggal: DUA_HARI_LALU,
    jamMulai: '13:00',
    jamSelesai: '15:00',
    asistenId: 'a1',
    status: 'SELESAI',
    deskripsi: 'Pertemuan 3: Pemodelan ERD dan transformasi skema relasional.',
    kapasitas: 32,
  },
  {
    id: 'ses-7',
    namaPraktikum: 'Sistem Operasi',
    topik: 'Penjadwalan Proses',
    kelas: 'IF-2A',
    lab: 'Lab C',
    labId: 'lab-c',
    tanggal: KEMARIN,
    jamMulai: '13:00',
    jamSelesai: '15:00',
    asistenId: 'a2',
    status: 'DIBUKA',
    deskripsi: 'Pertemuan 4: Algoritma penjadwalan FCFS, SJF, dan Round Robin.',
    kapasitas: 32,
  },
];

export const KEHADIRAN_SEED: Kehadiran[] = [
  {
    id: 'kehadiran-ses-4-p5',
    sesiId: 'ses-4',
    praktikanId: 'p5',
    waktuHadir: waktuWib(KEMARIN, '08:03'),
    lat: -7.04818,
    lng: 110.44077,
    jarak: 6,
    akurasi: 10,
  },
  {
    id: 'kehadiran-ses-4-p6',
    sesiId: 'ses-4',
    praktikanId: 'p6',
    waktuHadir: waktuWib(KEMARIN, '08:07'),
    lat: -7.04834,
    lng: 110.44084,
    jarak: 14,
    akurasi: 15,
  },
  {
    id: 'kehadiran-ses-4-p7',
    sesiId: 'ses-4',
    praktikanId: 'p7',
    waktuHadir: waktuWib(KEMARIN, '08:15'),
    lat: -7.04812,
    lng: 110.44077,
    jarak: 13,
    akurasi: 12,
  },
  {
    id: 'kehadiran-ses-6-p1',
    sesiId: 'ses-6',
    praktikanId: 'p1',
    waktuHadir: waktuWib(DUA_HARI_LALU, '13:04'),
    lat: -7.04817,
    lng: 110.44078,
    jarak: 8,
    akurasi: 9,
  },
  {
    id: 'kehadiran-ses-1-p2',
    sesiId: 'ses-1',
    praktikanId: 'p2',
    waktuHadir: waktuWib(HARI_INI, jamOffset(-25)),
    lat: -7.04900,
    lng: 110.44149,
    jarak: 4,
    akurasi: 8,
  },
];

export const IZIN_SEED: Izin[] = [
  {
    id: 'izin-ses-1-p3',
    sesiId: 'ses-1',
    praktikanId: 'p3',
    alasan: 'Tidak dapat mengikuti praktikum karena sedang demam tinggi dan disarankan istirahat oleh dokter klinik kampus.',
    kategoriAi: 'Sakit / Medis',
    ringkasanAi: 'Alasan berkaitan dengan kondisi kesehatan medis (demam tinggi & pemeriksaan klinik).',
    status: 'MENUNGGU',
    waktuPengajuan: waktuWib(HARI_INI, jamOffset(-60)),
  },
  {
    id: 'izin-ses-2-p4',
    sesiId: 'ses-2',
    praktikanId: 'p4',
    alasan: 'Mewakili jurusan dalam lomba pemrograman tingkat nasional sesuai surat tugas dekanat.',
    kategoriAi: 'Kegiatan Akademik / Delegasi',
    ringkasanAi: 'Alasan berkaitan dengan penugasan resmi kampus atau kompetisi akademik.',
    status: 'DITERIMA',
    waktuPengajuan: waktuWib(KEMARIN, '19:15'),
    waktuKeputusan: waktuWib(KEMARIN, '20:10'),
    reviewedAt: waktuWib(KEMARIN, '20:10'),
    reviewedBy: 'a1',
  },
];

export const LABS_SEED: Lab[] = [
  {
    id: 'lab-ap',
    nama: 'Lab AP',
    alamat: 'Gedung Dekanat FSM UNDIP',
    lat: -7.0490375,
    lng: 110.441484375,
    radius: 50,
    graceMenit: 10,
    dendaNominal: 5000,
  },
  {
    id: 'lab-b',
    nama: 'Lab B',
    alamat: 'Gedung E FSM UNDIP, lantai 2',
    lat: -7.0482375,
    lng: 110.440765625,
    radius: 100,
    graceMenit: 10,
    dendaNominal: 5000,
  },
  {
    id: 'lab-c',
    nama: 'Lab C',
    alamat: 'Gedung E FSM UNDIP, lantai 2',
    lat: -7.0482375,
    lng: 110.440765625,
    radius: 100,
    graceMenit: 10,
    dendaNominal: 5000,
  },
  {
    id: 'lab-d',
    nama: 'Lab D',
    alamat: 'Gedung E FSM UNDIP, lantai 2',
    lat: -7.0482375,
    lng: 110.440765625,
    radius: 100,
    graceMenit: 10,
    dendaNominal: 5000,
  },
];