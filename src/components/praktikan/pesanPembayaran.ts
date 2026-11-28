/** Pemetaan alasan gagal pembayaran ke key i18n atau pesan fallback. */

export type AlasanPembayaran =
  | 'TAGIHAN_TIDAK_DITEMUKAN'
  | 'SUDAH_LUNAS'
  | 'TIDAK_BERHAK'
  | 'JARINGAN'
  | 'SERVER_ERROR'
  | 'PEMBAYARAN_BELUM_TERSEDIA';

export function keyAlasanPembayaran(alasan: string) {
  switch (alasan) {
    case 'TAGIHAN_TIDAK_DITEMUKAN':
      return 'tagihan.errNotFound' as const;
    case 'SUDAH_LUNAS':
      return 'tagihan.errAlreadyPaid' as const;
    case 'TIDAK_BERHAK':
      return 'tagihan.errForbidden' as const;
    case 'JARINGAN':
      return 'tagihan.errNetwork' as const;
    case 'SERVER_ERROR':
      return 'tagihan.errServer' as const;
    case 'PEMBAYARAN_BELUM_TERSEDIA':
      return 'tagihan.errUnavailableBuild' as const;
    case 'BELUM_TERSEDIA':
      return 'tagihan.errUnavailableBackend' as const;
    default:
      return 'tagihan.errCreateDefault' as const;
  }
}
