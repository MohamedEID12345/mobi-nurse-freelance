import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';
import { requireUser, UserRow } from '@/lib/auth';
import { BookingRow, customerView, getBooking, nurseView, transition } from '@/lib/bookings';
import { customerCancel, nurseName, optionalLocation, readJson, startBookingPayment, submitReview } from '@/lib/booking-actions';
import { dispatch } from '@/lib/matching';
import { dismissOfferAlerts, notify } from '@/lib/notify';
import { reviewSchema } from '@/lib/validators';
import { audit } from '@/lib/audit';

export const POST = handler(async (req, { id, action }) => {
  const user = await requireUser(req);
  const b = await getBooking(id);
  const body = await readJson(req);
  return user.role === 'CUSTOMER' ? customerAction(user, b, action, body) : nurseAction(req, user, b, action, body);
});

async function customerAction(user: UserRow, b: BookingRow, action: string, body: Record<string, unknown>) {
  if (b.customer_id !== user.id) throw new ApiError('BOOKING_NOT_FOUND');
  switch (action) {
    case 'cancel':
      return ok(await customerView(await customerCancel(b, 'CUSTOMER', user.id, String(body.reason ?? '').slice(0, 300))));
    case 'pay':
      return ok(await startBookingPayment(b, 'CUSTOMER', user.id));
    case 'review': {
      const r = reviewSchema.safeParse(body);
      if (!r.success) throw new ApiError('VALIDATION_FAILED');
      await submitReview(b, user.id, r.data);
      return ok(await customerView(await getBooking(b.id)));
    }
    default:
      throw new ApiError('NOT_FOUND');
  }
}

async function nurseAction(req: Request, user: UserRow, b: BookingRow, action: string, body: Record<string, unknown>) {
  const loc = optionalLocation(body);
  const mine = b.nurse_id === user.id;
  const requireMine = () => { if (!mine) throw new ApiError('BOOKING_NOT_FOUND'); };

  switch (action) {
    case 'accept': {
      const updated = must(await db().rpc('mn_accept_offer', { p_booking: b.id, p_nurse: user.id })) as BookingRow;
      await dismissOfferAlerts(b.id, user.id);
      await notify([b.customer_id], {
        title: 'تم قبول طلبك ✅', body: `${await nurseName(user.id)} قبل/ت طلبك ${b.code} وسيتحرك إليك قريباً.`, link: `/app/bookings/${b.id}`,
      });
      return ok(await nurseView(updated, user.id));
    }
    case 'reject': {
      await db().from('booking_offers').update({ status: 'REJECTED', responded_at: new Date().toISOString() })
        .eq('booking_id', b.id).eq('nurse_id', user.id).eq('status', 'OFFERED');
      return ok();
    }
    case 'on-the-way': {
      requireMine();
      const u = await transition(b.id, 'NURSE_ON_THE_WAY', ['NURSE_ASSIGNED'], 'NURSE', user.id, null, loc.lat, loc.lng);
      await notify([b.customer_id], { title: 'الممرض في الطريق 🚗', body: `الممرض في الطريق إليك (طلب ${b.code}).`, link: `/app/bookings/${b.id}` });
      return ok(await nurseView(u, user.id));
    }
    case 'arrived': {
      requireMine();
      const u = await transition(b.id, 'NURSE_ARRIVED', ['NURSE_ON_THE_WAY', 'NURSE_ASSIGNED'], 'NURSE', user.id, null, loc.lat, loc.lng);
      await notify([b.customer_id], { title: 'الممرض وصل 📍', body: `الممرض وصل إلى موقعك (طلب ${b.code}).`, link: `/app/bookings/${b.id}` });
      return ok(await nurseView(u, user.id));
    }
    case 'start': {
      requireMine();
      const u = await transition(b.id, 'SERVICE_STARTED', ['NURSE_ARRIVED'], 'NURSE', user.id);
      await notify([b.customer_id], { title: 'بدأت الخدمة', body: `بدأ الممرض تقديم الخدمة (طلب ${b.code}).`, link: `/app/bookings/${b.id}` });
      return ok(await nurseView(u, user.id));
    }
    case 'complete': {
      requireMine();
      await transition(b.id, 'SERVICE_COMPLETED', ['SERVICE_STARTED'], 'NURSE', user.id);
      const u = await transition(b.id, 'WAITING_FOR_PAYMENT', ['SERVICE_COMPLETED'], 'NURSE', user.id, 'طلب الدفع');
      await notify([b.customer_id], { title: 'انتهت الخدمة — برجاء الدفع 💳', body: `المبلغ المطلوب للطلب ${b.code}: ${Number(b.total_amount)} ج.م`, link: `/app/bookings/${b.id}` });
      return ok(await nurseView(u, user.id));
    }
    case 'release': {
      requireMine();
      const reason = String(body.reason ?? '').slice(0, 300) || 'اعتذر الممرض';
      const u = must(await db().rpc('mn_nurse_release_booking', { p_booking: b.id, p_nurse: user.id, p_reason: reason })) as BookingRow;
      await audit(null, { actorType: 'USER', actorId: user.id, action: 'NURSE_RELEASED_BOOKING', targetType: 'BOOKING', targetId: b.id, newValue: { reason } });
      await notify([b.customer_id], { title: 'جارٍ البحث عن ممرض آخر', body: `اعتذر الممرض عن الطلب ${b.code}، ونبحث لك عن ممرض آخر الآن.`, link: `/app/bookings/${b.id}` });
      await dispatch(u);
      return ok();
    }
    case 'pay-on-behalf': {
      requireMine();
      return ok(await startBookingPayment(b, 'NURSE', user.id));
    }
    case 'due-settled': {
      requireMine();
      await db().from('customer_dues').update({ status: 'SETTLED', settled_at: new Date().toISOString() })
        .eq('booking_id', b.id).eq('nurse_id', user.id).eq('status', 'OPEN');
      return ok(await nurseView(await getBooking(b.id), user.id));
    }
    default:
      throw new ApiError('NOT_FOUND');
  }
}
