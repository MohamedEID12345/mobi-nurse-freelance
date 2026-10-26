import { db } from '@/lib/db';
import { ApiError, handler, ok, parseBody } from '@/lib/http';
import { createBooking, customerView } from '@/lib/bookings';
import { bool, loadSettings } from '@/lib/settings';
import { guestBookingSchema } from '@/lib/validators';
import { normalizeEgyptianMobile } from '@/lib/shared/phone';
import { randomToken, sha256 } from '@/lib/codes';

/** Urgent nursing request without an account. Returns a private tracking token. */
export const POST = handler(async (req) => {
  const b = await parseBody(req, guestBookingSchema);
  const settings = await loadSettings();
  if (!bool(settings, 'URGENT_REQUESTS_ENABLED')) throw new ApiError('URGENT_DISABLED');
  const phone = normalizeEgyptianMobile(b.phone);
  if (!phone) throw new ApiError('INVALID_PHONE');

  // Abuse guard: at most 3 urgent guest requests per phone per hour (idempotent retries excluded).
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db().from('bookings').select('id', { count: 'exact', head: true })
    .is('customer_id', null).eq('guest_phone', phone).gte('created_at', since).neq('idempotency_key', b.idempotencyKey);
  if ((count ?? 0) >= 3) throw new ApiError('TOO_MANY_ATTEMPTS');

  const token = randomToken();
  const { booking, created } = await createBooking({
    customerId: null, guest: { name: b.name, phone, tokenHash: sha256(token) }, familyMemberId: null,
    patientName: b.patientName?.trim() || b.name, serviceId: b.serviceId, governorateId: b.governorateId,
    cityId: b.cityId, address: b.address, latitude: b.latitude, longitude: b.longitude,
    description: b.description, notes: b.notes, isUrgent: true, scheduledAt: null, idempotencyKey: b.idempotencyKey,
  });
  if (!created) {
    // Idempotent retry (e.g. the first response was lost): rotate the tracking token.
    await db().from('bookings').update({ guest_token_hash: sha256(token) }).eq('id', booking.id);
  }
  return ok({ token, booking: await customerView(booking) }, created ? 201 : 200);
});
