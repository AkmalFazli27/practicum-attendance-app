import type { JenisPermissionBanner } from '@/components/ui';

import type { StatusLokasi } from '@/hooks/useLocation';

export type AksiBannerLokasi = 'minta-izin' | 'coba-lagi' | null;

/** Sumber banner menentukan handler tombol: jaringan → retrySync, lokasi → coba(). */
export type SumberBannerLokasi = 'lokasi' | 'jaringan';

export type BannerLokasi = {
  jenis: JenisPermissionBanner;
  sumber: SumberBannerLokasi;
  pesan?: string;
  aksi: AksiBannerLokasi;
};

function aksiUntuk(status: StatusLokasi): AksiBannerLokasi {
  switch (status) {
    case 'siap':
    case 'memuat':
      return null;
    case 'izin-ditolak':
      return 'minta-izin';
    case 'gps-mati':
    case 'koordinat-belum-ada':
    case 'error':
      return 'coba-lagi';
  }
}

/**
 * Menerjemahkan status `useLocation()` menjadi banner yang ditampilkan Peta.
 * Status `siap` tidak butuh banner; `memuat` hanya memberi tahu bahwa lokasi
 * masih dicari tanpa tombol aksi agar pengguna tidak memicu permintaan ganda.
 */
export function bannerLokasiDari(
  status: StatusLokasi,
  pesanError: string | null,
): BannerLokasi | null {
  switch (status) {
    case 'siap':
      return null;
    case 'memuat':
      return { jenis: 'koordinat-belum-ada', sumber: 'lokasi', aksi: null };
    case 'izin-ditolak':
      return {
        jenis: 'izin-lokasi-ditolak',
        sumber: 'lokasi',
        pesan: pesanError ?? undefined,
        aksi: aksiUntuk(status),
      };
    case 'gps-mati':
      return {
        jenis: 'gps-mati',
        sumber: 'lokasi',
        pesan: pesanError ?? undefined,
        aksi: aksiUntuk(status),
      };
    case 'koordinat-belum-ada':
      return {
        jenis: 'koordinat-belum-ada',
        sumber: 'lokasi',
        pesan: pesanError ?? undefined,
        aksi: aksiUntuk(status),
      };
    case 'error':
      return {
        jenis: 'error',
        sumber: 'lokasi',
        pesan: pesanError ?? undefined,
        aksi: aksiUntuk(status),
      };
  }
}

/**
 * Banner jaringan menang atas banner lokasi: bila data lab tidak bisa dimuat,
 * masalah koneksi lebih mendesak daripada status GPS.
 */
export function bannerPrioritas(
  errorJaringan: string | null,
  bannerLokasi: BannerLokasi | null,
): BannerLokasi | null {
  if (errorJaringan) {
    return {
      jenis: 'jaringan',
      sumber: 'jaringan',
      pesan: errorJaringan,
      aksi: 'coba-lagi',
    };
  }
  return bannerLokasi;
}

export type HandlerBanner = {
  mintaIzin: () => void;
  coba: () => void;
  retrySync: () => void;
};

/**
 * Layar tidak perlu menebak handler dari nama jenis banner; `sumber` sudah
 * menyatakan siapa pemilik aksinya.
 */
export function handlerBanner(
  banner: BannerLokasi,
  handler: HandlerBanner,
): (() => void) | undefined {
  if (banner.aksi === 'minta-izin') return handler.mintaIzin;
  if (banner.aksi === 'coba-lagi') {
    return banner.sumber === 'jaringan' ? handler.retrySync : handler.coba;
  }
  return undefined;
}
