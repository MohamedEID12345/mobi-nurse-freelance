export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = (x: number) => (x * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Opens the exact point in Google Maps (app or browser). */
export function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Turn-by-turn navigation to the point in Google Maps. */
export function directionsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function inEgypt(lat: number, lng: number): boolean {
  return lat >= 21.5 && lat <= 32 && lng >= 24.5 && lng <= 37.5;
}

/** Rough ETA at ~25 km/h city driving. */
export function etaMinutes(km: number): number {
  return Math.max(1, Math.round((km / 25) * 60));
}
