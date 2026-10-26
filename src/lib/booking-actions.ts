import { db } from './db';
import { ApiError, must } from './http';
import { notify } from './notify';
import { startPayment } from './payments';
import { BookingRow, CUSTOMER_CANCELLABLE, transition } from './bookings';
import { reviewSchema } from './validators';
import { z } from 'zod';

export async function customerCancel(b: BookingRow, actorType: 'CUSTOMER' | 'GUEST', actorId: string | null, reason?: string) {
  const updated = await transition(b.id, 'CANCELLED', CUSTOMER_CANCELLABLE, actorType, actorId, reason || 'ألغاه العميل');
  if (b.nurse_id) {
    await notify([b.nurse_id], { title: 'تم إلغاء الطلب', body: `ألغى العميل الطلب ${b.code}.`, link: '/app/nurse' });
  }
  return updated;
}

export async function startBookingPayment(b: BookingRow, payerType: 'CUSTOMER' | 'GUEST' | 'NURSE', payerUserId: string | null) {
  if (b.status !== 'WAITING_FOR_PAYMENT' || b.payment_status === 'PAID') throw new ApiError('NOT_PAYABLE');
  return startPayment({ purpose: 'BOOKING', bookingId: b.id, payerType, payerUserId, amount: Number(b.total_amount) });
}

export async function submitReview(b: BookingRow, customerId: string | null, body: z.infer<typeof reviewSchema>) {
  if (b.status !== 'PAID' || !b.nurse_id) throw new ApiError('INVALID_STATUS_TRANSITION');
  const { error } = await db().from('reviews').insert({
    booking_id: b.id, customer_id: customerId, nurse_id: b.nurse_id, rating: body.rating,
    punctuality: body.punctuality ?? null, professionalism: body.professionalism ?? null,
    communication: body.communication ?? null, quality: body.quality ?? null, comment: body.comment ?? '',
  });
  if (error) throw new ApiError(error.code === '23505' ? 'ALREADY_REVIEWED' : 'INTERNAL_ERROR', undefined, error.message);
  await notify([b.nurse_id], { title: 'تقييم جديد', body: `حصلت على ${body.rating} نجوم للطلب ${b.code}.`, link: '/app/nurse/profile' });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const j = await req.json();
    return j && typeof j === 'object' ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function optionalLocation(body: Record<string, unknown>): { lat?: number; lng?: number } {
  const lat = Number(body.latitude);
  const lng = Number(body.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && body.latitude != null ? { lat, lng } : {};
}

export async function nurseName(id: string): Promise<string> {
  const u = must(await db().from('app_users').select('full_name').eq('id', id).single()) as { full_name: string };
  return u.full_name;
}
