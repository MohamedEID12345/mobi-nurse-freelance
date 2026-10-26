import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';
import { publicUser, requireAdmin, UserRow } from '@/lib/auth';

export const GET = handler(async (req, { id }) => {
  await requireAdmin(req, 'CUSTOMERS_MANAGE');
  const user = must(await db().from('app_users').select('*').eq('id', id).eq('role', 'CUSTOMER').maybeSingle()) as UserRow | null;
  if (!user) throw new ApiError('NOT_FOUND');
  const [family, bookings, payments, complaints, dues] = await Promise.all([
    db().from('family_members').select('id, name, relation, birth_date, gender').eq('customer_id', id).is('deleted_at', null),
    db().from('bookings').select('id, code, status, service_name_ar, total_amount, created_at').eq('customer_id', id).order('created_at', { ascending: false }).limit(50),
    db().from('payments').select('merchant_order_id, amount, status, created_at, paid_at').eq('payer_user_id', id).order('created_at', { ascending: false }).limit(50),
    db().from('complaints').select('id, code, category, status, created_at').eq('customer_id', id).order('created_at', { ascending: false }).limit(50),
    db().from('customer_dues').select('id, booking_id, amount, status, created_at').eq('customer_id', id),
  ]);
  return ok({
    user: { ...publicUser(user), suspensionReason: (user as unknown as Record<string, unknown>).suspension_reason },
    family: must(family), bookings: must(bookings), payments: must(payments), complaints: must(complaints), dues: must(dues),
  });
});
