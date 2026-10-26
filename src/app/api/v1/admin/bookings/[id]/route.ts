import { db } from '@/lib/db';
import { handler, must, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { bookingHistory, getBooking } from '@/lib/bookings';
import { mapsLink } from '@/lib/shared/geo';

export const GET = handler(async (req, { id }) => {
  await requireAdmin(req, 'BOOKINGS_VIEW');
  const b = await getBooking(id);
  const [offers, payments, review, complaints, due, customer, nurse] = await Promise.all([
    db().from('booking_offers').select('nurse_id, distance_km, status, expires_at, responded_at, created_at, app_users(full_name, phone)').eq('booking_id', id).order('created_at'),
    db().from('payments').select('merchant_order_id, payer_type, amount, status, provider_transaction_id, provider_method, issue, created_at, paid_at').eq('booking_id', id).order('created_at'),
    db().from('reviews').select('*').eq('booking_id', id).maybeSingle(),
    db().from('complaints').select('id, code, category, status, description, created_at').eq('booking_id', id),
    db().from('customer_dues').select('*').eq('booking_id', id).maybeSingle(),
    b.customer_id ? db().from('app_users').select('id, full_name, phone').eq('id', b.customer_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    b.nurse_id ? db().from('app_users').select('id, full_name, phone').eq('id', b.nurse_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  return ok({
    booking: { ...b, mapsLink: mapsLink(b.latitude, b.longitude),
      nurseMapsLink: b.nurse_last_lat != null && b.nurse_last_lng != null ? mapsLink(b.nurse_last_lat, b.nurse_last_lng) : null },
    timeline: await bookingHistory(id),
    offers: (must(offers) as Array<Record<string, unknown>>).map((o) => {
      const u = (Array.isArray(o.app_users) ? o.app_users[0] : o.app_users) as { full_name: string; phone: string } | null;
      return { nurseId: o.nurse_id, nurseName: u?.full_name, distanceKm: Number(o.distance_km), status: o.status, createdAt: o.created_at, respondedAt: o.responded_at };
    }),
    payments: must(payments), review: must(review), complaints: must(complaints), due: must(due),
    customer: customer.data, nurse: nurse.data,
  });
});
