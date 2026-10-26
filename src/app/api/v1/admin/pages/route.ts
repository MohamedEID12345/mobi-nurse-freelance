import { db } from '@/lib/db';
import { handler, must, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'SETTINGS_MANAGE');
  return ok(must(await db().from('content_pages').select('*').order('sort_order')));
});
