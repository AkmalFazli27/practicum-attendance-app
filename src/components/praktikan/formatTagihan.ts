/** Helper format tagihan yang dipakai layar praktikan. */

export function formatRupiah(nominal: number): string {
  const nilai = Number.isFinite(nominal) ? nominal : 0;
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(nilai);
  } catch {
    return `Rp${nilai.toLocaleString('id-ID')}`;
  }
}

export function formatTanggalTagihan(iso: string, isEn: boolean): string {
  if (!iso) return '-';
  const tanggal = new Date(iso);
  if (Number.isNaN(tanggal.getTime())) return '-';
  try {
    return tanggal.toLocaleDateString(isEn ? 'en-GB' : 'id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}
