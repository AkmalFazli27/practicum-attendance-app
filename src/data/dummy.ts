export type Peran = 'asisten' | 'praktikan';

export type StatusSesi = 'TERJADWAL' | 'DIBUKA' | 'SELESAI';

export type StatusIzin = 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';

export type User = {
  id: string;
  nama: string;
  email?: string;
  nim?: string;
  peran: Peran;
  kelas?: string;
};

export type Sesi = {
  id: string;
  namaPraktikum: string;
  topik?: string;
  kelas: string;
  lab: string;
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
};

export type SesiInput = {
  namaPraktikum: string;
  topik?: string;
  kelas: string;
  lab: string;
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
  reviewedBy?: string;
};

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
    lab: 'Lab Multimedia',
    tanggal: '2026-10-21',
    jamMulai: '08:00',
    jamSelesai: '10:00',
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
    lab: 'Lab Basis Data',
    tanggal: '2026-10-21',
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
    lab: 'Lab Jaringan',
    tanggal: '2026-10-22',
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
    lab: 'Lab Sistem Operasi',
    tanggal: '2026-10-20',
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
    lab: 'Lab Multimedia',
    tanggal: '2026-10-23',
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
    lab: 'Lab Basis Data',
    tanggal: '2026-10-19',
    jamMulai: '13:00',
    jamSelesai: '15:00',
    asistenId: 'a1',
    status: 'SELESAI',
    deskripsi: 'Pertemuan 3: Pemodelan ERD dan transformasi skema relasional.',
    kapasitas: 32,
  },
];

export const KEHADIRAN_SEED: Kehadiran[] = [
  {
    id: 'kehadiran-ses-4-p5',
    sesiId: 'ses-4',
    praktikanId: 'p5',
    waktuHadir: '2026-10-20T08:03:00',
  },
  {
    id: 'kehadiran-ses-4-p6',
    sesiId: 'ses-4',
    praktikanId: 'p6',
    waktuHadir: '2026-10-20T08:07:00',
  },
  {
    id: 'kehadiran-ses-4-p7',
    sesiId: 'ses-4',
    praktikanId: 'p7',
    waktuHadir: '2026-10-20T08:15:00',
  },
  {
    id: 'kehadiran-ses-6-p1',
    sesiId: 'ses-6',
    praktikanId: 'p1',
    waktuHadir: '2026-10-19T13:04:00',
  },
  {
    id: 'kehadiran-ses-1-p2',
    sesiId: 'ses-1',
    praktikanId: 'p2',
    waktuHadir: '2026-10-21T08:05:00',
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
    waktuPengajuan: '2026-10-21T07:45:00',
  },
  {
    id: 'izin-ses-2-p4',
    sesiId: 'ses-2',
    praktikanId: 'p4',
    alasan: 'Mewakili jurusan dalam lomba pemrograman tingkat nasional sesuai surat tugas dekanat.',
    kategoriAi: 'Kegiatan Akademik / Delegasi',
    ringkasanAi: 'Alasan berkaitan dengan penugasan resmi kampus atau kompetisi akademik.',
    status: 'DITERIMA',
    waktuPengajuan: '2026-10-20T19:15:00',
    waktuKeputusan: '2026-10-20T20:10:00',
  },
];
