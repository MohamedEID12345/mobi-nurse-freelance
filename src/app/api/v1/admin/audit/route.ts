import { db } from '@/lib/db';
import { handler, must, ok, pageParams, query } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'AUDIT_VIEW');
  const { from, to } = pageParams(req, 50);
  let sel = db().from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
  const action = query(req, 'action');
  if (action) sel = sel.eq('action', action);
  const targetId = query(req, 'targetId');
  if (targetId) sel = sel.eq('target_id', targetId);
  const { data, error, count } = await sel;
  return ok({ total: count ?? 0, items: must({ data, error }) });
});
