/** Jarak presensi ke titik lab, mis. "6 m" atau "1,2 km". */
export function formatJarak(meter: number): string {
  if (!Number.isFinite(meter) || meter < 0) return '-';
  if (meter >= 1000) return `${(meter / 1000).toFixed(1).replace('.', ',')} km`;
  return `${Math.round(meter)} m`;
}
