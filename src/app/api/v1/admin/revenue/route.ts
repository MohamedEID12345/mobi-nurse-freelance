import { db } from '@/lib/db';
import { handler, must, ok, query } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { rangeFrom } from '@/lib/range';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'FINANCE_VIEW');
  const { from, to } = rangeFrom(query(req, 'range') ?? 'month', query(req, 'from'), query(req, 'to'));
  const report = must(await db().rpc('mn_revenue_report', { p_from: from.toISOString(), p_to: to.toISOString() })) as Record<string, unknown>;
  const net = Number(report.commission) + Number(report.registration_fees) - Number(report.refunds);
  return ok({ range: { from, to }, ...report, net_platform_revenue: net });
});
