import { handler, ok } from '@/lib/http';
import { customerView } from '@/lib/bookings';
import { refreshSearch } from '@/lib/matching';
import { bookingByToken } from '@/lib/guest';

export const GET = handler(async (_req, { token }) => ok(await customerView(await refreshSearch(await bookingByToken(token)))));
