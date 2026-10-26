import { db } from '@/lib/db';
import { handler, must, ok, pageParams, query } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'FINANCE_VIEW');
  const { from, to } = pageParams(req);
  let sel = db().from('payments').select('id, merchant_order_id, purpose, booking_id, nurse_id, payer_type, amount, status, provider_transaction_id, provider_method, issue, created_at, paid_at, bookings(code)', { count: 'exact' })
    .order('created_at', { ascending: false }).range(from, to);
  const status = query(req, 'status');
  if (status) sel = sel.eq('status', status);
  const purpose = query(req, 'purpose');
  if (purpose) sel = sel.eq('purpose', purpose);
  if (query(req, 'issues') === 'true') sel = sel.not('issue', 'is', null);
  const { data, error, count } = await sel;
  const rows = must({ data, error }) as Array<Record<string, unknown>>;
  return ok({ total: count ?? 0, items: rows.map((p) => {
    const bk = (Array.isArray(p.bookings) ? p.bookings[0] : p.bookings) as { code: string } | null;
    return {
      id: p.id, reference: p.merchant_order_id, purpose: p.purpose, bookingId: p.booking_id, bookingCode: bk?.code ?? null,
      nurseId: p.nurse_id, payerType: p.payer_type, amount: Number(p.amount), status: p.status,
      transactionId: p.provider_transaction_id, method: p.provider_method, issue: p.issue, createdAt: p.created_at, paidAt: p.paid_at,
    };
  }) });
});
