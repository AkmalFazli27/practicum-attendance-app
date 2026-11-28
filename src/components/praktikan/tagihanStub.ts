/**
 * Data contoh untuk mode dummy (tanpa Firebase).
 * Tipe mengikuti kontrak resmi `src/data/dummy.ts`.
 * TODO(sprint4): hapus file ini setelah seed tagihan resmi tersedia.
 */

import type { Pembayaran, Tagihan } from '@/data/dummy';

export const TAGIHAN_STUB: Tagihan[] = [
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

export const PEMBAYARAN_STUB: Pembayaran[] = [
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
