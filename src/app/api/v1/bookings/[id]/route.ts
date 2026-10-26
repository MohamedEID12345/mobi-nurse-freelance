import { db } from '@/lib/db';
import { ApiError, handler, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { customerView, getBooking, nurseView } from '@/lib/bookings';
import { refreshSearch } from '@/lib/matching';

export const GET = handler(async (req, { id }) => {
  const user = await requireUser(req);
  let b = await getBooking(id);
  if (user.role === 'CUSTOMER') {
    if (b.customer_id !== user.id) throw new ApiError('BOOKING_NOT_FOUND');
    b = await refreshSearch(b);
    return ok(await customerView(b));
  }
  if (b.nurse_id !== user.id) {
    const { data: offer } = await db().from('booking_offers').select('id').eq('booking_id', id).eq('nurse_id', user.id).maybeSingle();
    if (!offer) throw new ApiError('BOOKING_NOT_FOUND');
  }
  return ok(await nurseView(b, user.id));
});
