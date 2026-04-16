export function generateAccountNumber(name: string, sequence: number): string {
  const root = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6).padEnd(6, 'X');
  return `${root}${String(sequence).padStart(3, '0')}`;
}

export function computeVat(price: number, vatRate: number) {
  const vat = Number(((price * vatRate) / 100).toFixed(2));
  const total = Number((price + vat).toFixed(2));
  return { vat, total };
}

export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(3));
}

export function inferYardFromLatLng(lat?: number | null): number {
  if (lat == null) return 1;
  if (lat >= 51.58) return 1;
  if (lat < 51.44) return 2;
  return 3;
}
