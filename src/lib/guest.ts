import { db } from './db';
import { ApiError, must } from './http';
import { BookingRow } from './bookings';
import { sha256 } from './codes';

export async function bookingByToken(token: string): Promise<BookingRow> {
  if (!token || token.length > 100) throw new ApiError('BOOKING_NOT_FOUND');
  const b = must(await db().from('bookings').select('*').eq('guest_token_hash', sha256(token)).maybeSingle()) as BookingRow | null;
  if (!b) throw new ApiError('BOOKING_NOT_FOUND');
  return b;
}
