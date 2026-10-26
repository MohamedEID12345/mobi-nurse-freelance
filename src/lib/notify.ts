import { db } from './db';
import { sendPush } from './fcm';

/** In-app notification + Android push (if Firebase is configured). Never throws. */
export async function notify(userIds: Array<string | null | undefined>,
                             msg: { title: string; body: string; link?: string; channel?: 'requests' | 'general' }) {
  const ids = [...new Set(userIds.filter((x): x is string => Boolean(x)))];
  if (ids.length === 0) return;
  try {
    await db().from('notifications').insert(ids.map((id) => ({ user_id: id, title: msg.title, body: msg.body, link: msg.link ?? null })));
    const { data } = await db().from('app_users').select('id, fcm_token').in('id', ids).not('fcm_token', 'is', null);
    const targets = (data ?? []).map((u: { id: string; fcm_token: string }) => ({ userId: u.id, token: u.fcm_token }));
    await Promise.race([sendPush(targets, msg), new Promise((r) => setTimeout(r, 4000))]);
  } catch (e) {
    console.error('[notify] failed', e);
  }
}
