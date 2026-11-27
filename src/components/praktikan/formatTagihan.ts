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

function parseTanggalTagihan(iso: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [tahun, bulan, hari] = iso.split('-').map(Number);
    const lokal = new Date(tahun, bulan - 1, hari);
    return Number.isNaN(lokal.getTime()) ? null : lokal;
  }

  const tanggal = new Date(iso);
  return Number.isNaN(tanggal.getTime()) ? null : tanggal;
}

export function formatTanggalTagihan(iso: string, isEn: boolean): string {
  if (!iso) return '-';
  const tanggal = parseTanggalTagihan(iso);
  if (!tanggal) return '-';
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
