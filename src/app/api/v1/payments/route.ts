import { db } from '@/lib/db';
import { handler, must, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';

export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const rows = must(await db().from('payments').select('id, merchant_order_id, purpose, booking_id, amount, status, provider_method, created_at, paid_at')
    .eq('payer_user_id', user.id).order('created_at', { ascending: false }).limit(100)) as Array<Record<string, unknown>>;
  return ok(rows.map((p) => ({
    id: p.id, reference: p.merchant_order_id, purpose: p.purpose, bookingId: p.booking_id, amount: Number(p.amount),
    status: p.status, method: p.provider_method, createdAt: p.created_at, paidAt: p.paid_at,
  })));
});
