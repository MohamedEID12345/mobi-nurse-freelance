import { db } from '@/lib/db';
import { handler, must, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getNurseProfile } from '@/lib/nurse';
import { refreshStaleSearches } from '@/lib/matching';

/** Live request offers for this nurse + current job. Polled every few seconds while online. */
export const GET = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const p = await getNurseProfile(user.id);
  if (p.is_online) await refreshStaleSearches(user.governorate_id);

  const nowIso = new Date().toISOString();
  const offers = must(await db().from('booking_offers').select('id, booking_id, distance_km, expires_at')
    .eq('nurse_id', user.id).eq('status', 'OFFERED').gt('expires_at', nowIso).order('created_at', { ascending: false })) as
    Array<{ id: string; booking_id: string; distance_km: string; expires_at: string }>;
  let items: unknown[] = [];
  if (offers.length) {
    const bookings = must(await db().from('bookings').select('id, code, status, service_name_ar, patient_name, description, is_urgent, scheduled_at, total_amount, nurse_amount, city_id, cities(name_ar)')
      .in('id', offers.map((o) => o.booking_id)).eq('status', 'SEARCHING')) as Array<Record<string, unknown>>;
    items = offers.flatMap((o) => {
      const b = bookings.find((x) => x.id === o.booking_id);
      if (!b) return [];
      const city = b.cities as { name_ar: string } | { name_ar: string }[] | null;
      return [{
        bookingId: b.id, code: b.code, serviceName: b.service_name_ar, patientName: b.patient_name,
        description: String(b.description ?? '').slice(0, 300), isUrgent: b.is_urgent, scheduledAt: b.scheduled_at,
        cityName: Array.isArray(city) ? city[0]?.name_ar : city?.name_ar, distanceKm: Number(o.distance_km),
        total: Number(b.total_amount), nurseAmount: Number(b.nurse_amount), expiresAt: o.expires_at,
      }];
    });
  }
  const { data: active } = await db().from('bookings').select('id, code, status, service_name_ar, patient_name, scheduled_at')
    .eq('nurse_id', user.id).in('status', ['NURSE_ASSIGNED', 'NURSE_ON_THE_WAY', 'NURSE_ARRIVED', 'SERVICE_STARTED', 'WAITING_FOR_PAYMENT'])
    .order('created_at');
  return ok({
    isOnline: p.is_online,
    offers: items,
    activeJobs: (active ?? []).map((b: Record<string, unknown>) => ({
      id: b.id, code: b.code, status: b.status, serviceName: b.service_name_ar, patientName: b.patient_name, scheduledAt: b.scheduled_at,
    })),
  });
});
