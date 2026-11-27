/**
 * Tipe dan data stub sementara untuk Task 2.
 * TODO(sprint4): hapus tipe lokal ini setelah tipe resmi PM tersedia.
 */

export type StatusTagihanLokal =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'DIBEBASKAN';

export type TagihanLokal = {
  id: string;
  praktikanId: string;
  sesiId: string;
  labId: string;
  kehadiranId: string;
  nominal: number;
  menitTerlambat: number;
  status: StatusTagihanLokal;
  dibuatPada: string;
  dibayarPada?: string;
};

export type PembayaranLokal = {
  id: string;
  tagihanId: string;
  praktikanId: string;
  nominal: number;
  status: 'pending' | 'success' | 'failed';
  statusMidtrans: string;
  metode?: string;
  dibuatPada: string;
  diperbaruiPada: string;
};

export const TAGIHAN_STUB: TagihanLokal[] = [
  {
    id: 'tagihan-ses-1-p1',
    praktikanId: 'p1',
    sesiId: 'ses-1',
    labId: 'lab-ap',
    kehadiranId: 'kehadiran-ses-1-p1',
    nominal: 5000,
    menitTerlambat: 6,
    status: 'PENDING',
    dibuatPada: '2026-11-27T08:21:00+07:00',
  },
  {
    id: 'tagihan-ses-4-p1',
    praktikanId: 'p1',
    sesiId: 'ses-4',
    labId: 'lab-d',
    kehadiranId: 'kehadiran-ses-4-p1',
    nominal: 5000,
    menitTerlambat: 15,
    status: 'UNPAID',
    dibuatPada: '2026-11-26T08:15:00+07:00',
  },
  {
    id: 'tagihan-ses-7-p1',
    praktikanId: 'p1',
    sesiId: 'ses-7',
    labId: 'lab-c',
    kehadiranId: 'kehadiran-ses-7-p1',
    nominal: 5000,
    menitTerlambat: 20,
    status: 'FAILED',
    dibuatPada: '2026-11-26T13:20:00+07:00',
  },
  {
    id: 'tagihan-ses-6-p1',
    praktikanId: 'p1',
    sesiId: 'ses-6',
    labId: 'lab-b',
    kehadiranId: 'kehadiran-ses-6-p1',
    nominal: 5000,
    menitTerlambat: 9,
    status: 'PAID',
    dibuatPada: '2026-11-25T13:09:00+07:00',
    dibayarPada: '2026-11-25T13:20:00+07:00',
  },
  {
    id: 'tagihan-ses-2-p1',
    praktikanId: 'p1',
    sesiId: 'ses-2',
    labId: 'lab-b',
    kehadiranId: 'kehadiran-ses-2-p1',
    nominal: 5000,
    menitTerlambat: 3,
    status: 'DIBEBASKAN',
    dibuatPada: '2026-11-26T10:18:00+07:00',
  },
];

export const PEMBAYARAN_STUB: PembayaranLokal[] = [
  {
    id: 'order-ses-1-p1',
    tagihanId: 'tagihan-ses-1-p1',
    praktikanId: 'p1',
    nominal: 5000,
    status: 'pending',
    statusMidtrans: 'pending',
    metode: 'qris',
    dibuatPada: '2026-11-27T08:22:00+07:00',
    diperbaruiPada: '2026-11-27T08:22:00+07:00',
  },
  {
    id: 'order-ses-7-p1',
    tagihanId: 'tagihan-ses-7-p1',
    praktikanId: 'p1',
    nominal: 5000,
    status: 'failed',
    statusMidtrans: 'deny',
    metode: 'bank_transfer',
    dibuatPada: '2026-11-26T13:21:00+07:00',
    diperbaruiPada: '2026-11-26T13:25:00+07:00',
  },
  {
    id: 'order-ses-6-p1',
    tagihanId: 'tagihan-ses-6-p1',
    praktikanId: 'p1',
    nominal: 5000,
    status: 'success',
    statusMidtrans: 'settlement',
    metode: 'qris',
    dibuatPada: '2026-11-25T13:18:00+07:00',
    diperbaruiPada: '2026-11-25T13:20:00+07:00',
  },
];
