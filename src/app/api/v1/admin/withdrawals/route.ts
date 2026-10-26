import { db } from '@/lib/db';
import { handler, must, ok, pageParams, query } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'FINANCE_VIEW');
  const { from, to } = pageParams(req);
  let sel = db().from('withdrawals').select('*, app_users(full_name, phone)', { count: 'exact' })
    .order('created_at', { ascending: false }).range(from, to);
  const status = query(req, 'status');
  if (status) sel = sel.eq('status', status);
  const { data, error, count } = await sel;
  const rows = must({ data, error }) as Array<Record<string, unknown>>;
  return ok({ total: count ?? 0, items: rows.map((w) => {
    const u = (Array.isArray(w.app_users) ? w.app_users[0] : w.app_users) as { full_name: string; phone: string } | null;
    return {
      id: w.id, nurseId: w.nurse_id, nurseName: u?.full_name, nursePhone: u?.phone, amount: Number(w.amount),
      method: w.method, receivingAccount: w.receiving_account, status: w.status, adminNote: w.admin_note,
      reference: w.reference, createdAt: w.created_at, paidAt: w.paid_at,
    };
  }) });
});
