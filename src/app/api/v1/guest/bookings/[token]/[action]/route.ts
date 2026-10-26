import { ApiError, handler, ok } from '@/lib/http';
import { customerView, getBooking } from '@/lib/bookings';
import { customerCancel, readJson, startBookingPayment, submitReview } from '@/lib/booking-actions';
import { bookingByToken } from '@/lib/guest';
import { reviewSchema } from '@/lib/validators';

export const POST = handler(async (req, { token, action }) => {
  const b = await bookingByToken(token);
  const body = await readJson(req);
  switch (action) {
    case 'cancel':
      return ok(await customerView(await customerCancel(b, 'GUEST', null, String(body.reason ?? '').slice(0, 300))));
    case 'pay':
      return ok(await startBookingPayment(b, 'GUEST', null));
    case 'review': {
      const r = reviewSchema.safeParse(body);
      if (!r.success) throw new ApiError('VALIDATION_FAILED');
      await submitReview(b, null, r.data);
      return ok(await customerView(await getBooking(b.id)));
    }
    default:
      throw new ApiError('NOT_FOUND');
  }
});
