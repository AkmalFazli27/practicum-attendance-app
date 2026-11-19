export type Titik = { lat: number; lng: number };

export function hitungJarak(a: Titik, b: Titik): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function koordinatValid(k: Titik): boolean {
  return (
    Number.isFinite(k.lat) &&
    Number.isFinite(k.lng) &&
    Math.abs(k.lat) <= 90 &&
    Math.abs(k.lng) <= 180
  );
}