import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { BookingStatus, getBooking, transition } from '@/lib/bookings';
import { dispatch } from '@/lib/matching';
import { notify } from '@/lib/notify';
import { audit } from '@/lib/audit';
import { readJson } from '@/lib/booking-actions';

const ADMIN_CANCELLABLE: BookingStatus[] = ['CREATED', 'SEARCHING', 'NURSE_ASSIGNED', 'NURSE_ON_THE_WAY', 'NURSE_ARRIVED',
  'SERVICE_STARTED', 'SERVICE_COMPLETED', 'WAITING_FOR_PAYMENT', 'DISPUTED'];

export const POST = handler(async (req, { id, action }) => {
  const admin = await requireAdmin(req, 'BOOKINGS_MANAGE');
  const b = await getBooking(id);
  const reason = String((await readJson(req)).reason ?? '').trim().slice(0, 500);
  switch (action) {
    case 'cancel': {
      if (!reason) throw new ApiError('VALIDATION_FAILED', { reason: 'required' });
      await transition(id, 'CANCELLED', ADMIN_CANCELLABLE, 'ADMIN', admin.id, reason);
      await notify([b.customer_id, b.nurse_id], { title: 'تم إلغاء الطلب', body: `تم إلغاء الطلب ${b.code} من الإدارة: ${reason}`, link: '/app' });
      break;
    }
    case 'dispute':
      await transition(id, 'DISPUTED', ['SERVICE_STARTED', 'SERVICE_COMPLETED', 'WAITING_FOR_PAYMENT', 'PAID'], 'ADMIN', admin.id, reason || 'نزاع');
      break;
    case 'resolve-dispute': {
      const hist = must(await db().from('booking_status_history').select('from_status').eq('booking_id', id)
        .eq('to_status', 'DISPUTED').order('created_at', { ascending: false }).limit(1).maybeSingle()) as { from_status: BookingStatus } | null;
      if (!hist?.from_status) throw new ApiError('INVALID_STATUS_TRANSITION');
      await transition(id, hist.from_status, ['DISPUTED'], 'ADMIN', admin.id, reason || 'تم حل النزاع');
      break;
    }
    case 'redispatch': {
      if (b.status !== 'SEARCHING') throw new ApiError('INVALID_STATUS_TRANSITION');
      const n = await dispatch(b);
      await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'BOOKING_REDISPATCHED', targetType: 'BOOKING', targetId: id, newValue: { offered: n } });
      return ok({ offered: n });
    }
    default:
      throw new ApiError('NOT_FOUND');
  }
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: `BOOKING_${action.toUpperCase().replace(/-/g, '_')}`, targetType: 'BOOKING', targetId: id, oldValue: { status: b.status }, newValue: { reason } });
  return ok();
});
