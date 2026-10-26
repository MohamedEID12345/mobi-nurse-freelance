import { db } from '@/lib/db';
import { handler, must, ok, query } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { loadSettings } from '@/lib/settings';
import { rangeFrom } from '@/lib/range';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'DASHBOARD_VIEW');
  const { from, to } = rangeFrom(query(req, 'range'), query(req, 'from'), query(req, 'to'));
  const gov = query(req, 'governorateId');
  const [stats, pending, searching, settings] = await Promise.all([
    db().rpc('mn_dashboard_stats', { p_from: from.toISOString(), p_to: to.toISOString(), p_gov: gov }),
    db().from('nurse_profiles').select('user_id, documents_submitted_at, app_users(full_name, phone)')
      .eq('verification_status', 'PENDING_VERIFICATION').order('documents_submitted_at').limit(8),
    db().from('bookings').select('id, code, service_name_ar, search_started_at, is_urgent').eq('status', 'SEARCHING')
      .lt('search_started_at', new Date(Date.now() - 10 * 60_000).toISOString()).order('search_started_at').limit(8),
    loadSettings(),
  ]);
  return ok({
    range: { from: from.toISOString(), to: to.toISOString() },
    stats: must(stats),
    pendingNurses: (must(pending) as Array<Record<string, unknown>>).map((p) => {
      const u = p.app_users as { full_name: string; phone: string } | { full_name: string; phone: string }[] | null;
      const user = Array.isArray(u) ? u[0] : u;
      return { id: p.user_id, name: user?.full_name, phone: user?.phone, submittedAt: p.documents_submitted_at };
    }),
    longSearches: must(searching),
    adminWhatsapp: settings.ADMIN_WHATSAPP,
  });
});
