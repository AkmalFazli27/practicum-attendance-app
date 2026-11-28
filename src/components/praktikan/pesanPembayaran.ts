/** Pemetaan alasan gagal pembayaran ke pesan dua bahasa. */

export type AlasanPembayaran =
  | 'TAGIHAN_TIDAK_DITEMUKAN'
  | 'SUDAH_LUNAS'
  | 'TIDAK_BERHAK'
  | 'JARINGAN'
  | 'SERVER_ERROR'
  | 'PEMBAYARAN_BELUM_TERSEDIA';

export function pesanAlasanPembayaran(alasan: string, isEn: boolean): string {
  switch (alasan) {
    case 'TAGIHAN_TIDAK_DITEMUKAN':
      return isEn
        ? 'Bill not found. Reload the page.'
        : 'Tagihan tidak ditemukan. Muat ulang halaman.';
    case 'SUDAH_LUNAS':
      return isEn ? 'This bill is already paid.' : 'Tagihan ini sudah lunas.';
    case 'TIDAK_BERHAK':
      return isEn
        ? 'You are not allowed to pay this bill.'
        : 'Kamu tidak berhak membayar tagihan ini.';
    case 'JARINGAN':
      return isEn
        ? 'Cannot reach the payment server. Check your connection.'
        : 'Tidak dapat terhubung ke server pembayaran. Periksa koneksi internetmu.';
    case 'SERVER_ERROR':
      return isEn
        ? 'The payment server is having trouble. Try again shortly.'
        : 'Server pembayaran sedang bermasalah. Coba lagi beberapa saat lagi.';
    case 'PEMBAYARAN_BELUM_TERSEDIA':
      return isEn
        ? 'Payment is not available in this build yet.'
        : 'Pembayaran belum tersedia di build ini.';
    case 'BELUM_TERSEDIA':
      return isEn
        ? 'Payment is not available yet. The backend is still being prepared.'
        : 'Pembayaran belum tersedia. Backend masih disiapkan.';
    default:
      return isEn
        ? 'Failed to create the payment transaction.'
        : 'Gagal membuat transaksi pembayaran.';
  }
}
