export type Peran = 'asisten' | 'praktikan';

export type StatusSesi = 'TERJADWAL' | 'DIBUKA' | 'SELESAI';

export type User = {
  id: string;
  nama: string;
  nim?: string;
  peran: Peran;
  kelas?: string;
};

export type Sesi = {
  id: string;
  namaPraktikum: string;
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
};

export type Kehadiran = {
  id: string;
  sesiId: string;
  praktikanId: string;
  /** ISO string, diisi otomatis saat presensi */
  waktuHadir: string;
};

export const USERS: User[] = [
  { id: 'a1', nama: 'Budi Santoso', nim: '2210512001', peran: 'asisten' },
  { id: 'a2', nama: 'Siti Rahma', nim: '2210512002', peran: 'asisten' },
  { id: 'p1', nama: 'Andi Pratama', nim: '2310512001', peran: 'praktikan', kelas: 'IF-2A' },
  { id: 'p2', nama: 'Bella Putri', nim: '2310512002', peran: 'praktikan', kelas: 'IF-2A' },
  { id: 'p3', nama: 'Citra Dewi', nim: '2310512003', peran: 'praktikan', kelas: 'IF-2A' },
  { id: 'p4', nama: 'Dimas Saputra', nim: '2310512004', peran: 'praktikan', kelas: 'IF-2A' },
  { id: 'p5', nama: 'Eka Lestari', nim: '2310512005', peran: 'praktikan', kelas: 'IF-2B' },
  { id: 'p6', nama: 'Fajar Nugroho', nim: '2310512006', peran: 'praktikan', kelas: 'IF-2B' },
  { id: 'p7', nama: 'Gita Maharani', nim: '2310512007', peran: 'praktikan', kelas: 'IF-2B' },
  { id: 'p8', nama: 'Hendra Wijaya', nim: '2310512008', peran: 'praktikan', kelas: 'IF-2B' },
];

export const SESI_SEED: Sesi[] = [
  {
    id: 'ses-1',
    namaPraktikum: 'Pemrograman Web',
    kelas: 'IF-2A',
    lab: 'Lab Multimedia',
    tanggal: '2026-10-21',
    jamMulai: '08:00',
    jamSelesai: '10:00',
    asistenId: 'a1',
    status: 'DIBUKA',
    deskripsi: 'Pertemuan 4: Layout responsif dengan flexbox dan komponen React.',
  },
  {
    id: 'ses-2',
    namaPraktikum: 'Basis Data',
    kelas: 'IF-2A',
    lab: 'Lab Basis Data',
    tanggal: '2026-10-21',
    jamMulai: '10:15',
    jamSelesai: '12:15',
    asistenId: 'a2',
    status: 'TERJADWAL',
    deskripsi: 'Pertemuan 4: Normalisasi tabel dan relasi antar entitas.',
  },
  {
    id: 'ses-3',
    namaPraktikum: 'Jaringan Komputer',
    kelas: 'IF-2B',
    lab: 'Lab Jaringan',
    tanggal: '2026-10-22',
    jamMulai: '13:00',
    jamSelesai: '15:00',
    asistenId: 'a1',
    status: 'TERJADWAL',
    deskripsi: 'Pertemuan 3: Konfigurasi IP statis dan pengujian konektivitas.',
  },
  {
    id: 'ses-4',
    namaPraktikum: 'Sistem Operasi',
    kelas: 'IF-2B',
    lab: 'Lab Sistem Operasi',
    tanggal: '2026-10-20',
    jamMulai: '08:00',
    jamSelesai: '10:00',
    asistenId: 'a2',
    status: 'SELESAI',
    deskripsi: 'Pertemuan 3: Manajemen proses dan perintah dasar Linux.',
  },
  {
    id: 'ses-5',
    namaPraktikum: 'Pemrograman Web',
    kelas: 'IF-2B',
    lab: 'Lab Multimedia',
    tanggal: '2026-10-23',
    jamMulai: '10:15',
    jamSelesai: '12:15',
    asistenId: 'a1',
    status: 'TERJADWAL',
    deskripsi: 'Pertemuan 4: Layout responsif dengan flexbox dan komponen React.',
  },
  {
    id: 'ses-6',
    namaPraktikum: 'Basis Data',
    kelas: 'IF-2B',
    lab: 'Lab Basis Data',
    tanggal: '2026-10-24',
    jamMulai: '13:00',
    jamSelesai: '15:00',
    asistenId: 'a2',
    status: 'TERJADWAL',
    deskripsi: 'Pertemuan 4: Normalisasi tabel dan relasi antar entitas.',
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
    id: 'kehadiran-ses-1-p1',
    sesiId: 'ses-1',
    praktikanId: 'p1',
    waktuHadir: '2026-10-21T08:02:00',
  },
  {
    id: 'kehadiran-ses-1-p2',
    sesiId: 'ses-1',
    praktikanId: 'p2',
    waktuHadir: '2026-10-21T08:05:00',
  },
];
