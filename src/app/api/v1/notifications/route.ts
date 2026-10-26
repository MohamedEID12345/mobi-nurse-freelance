import { db } from '@/lib/db';
import { handler, must, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';

export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const rows = must(await db().from('notifications').select('id, title, body, link, is_read, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(60)) as Array<Record<string, unknown>>;
  return ok({
    unread: rows.filter((n) => !n.is_read).length,
    items: rows.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, read: n.is_read, createdAt: n.created_at })),
  });
});

/** Marks all as read. */
export const POST = handler(async (req) => {
  const user = await requireUser(req);
  await db().from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  return ok();
});
