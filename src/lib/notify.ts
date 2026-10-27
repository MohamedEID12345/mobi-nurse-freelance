import { db } from './db';
import { sendData, sendPush } from './fcm';

/** In-app notification + Android push (if Firebase is configured). Never throws. */
export async function notify(userIds: Array<string | null | undefined>,
                             msg: { title: string; body: string; link?: string; channel?: 'requests' | 'general'; ttlSeconds?: number; bookingId?: string }) {
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

/** Silently stops the ringing request alert on nurses' phones (request taken by someone else / cancelled). */
export async function dismissOfferAlerts(bookingId: string, exceptNurseId?: string | null) {
  try {
    const { data: offers } = await db().from('booking_offers').select('nurse_id').eq('booking_id', bookingId);
    const ids = (offers ?? []).map((o: { nurse_id: string }) => o.nurse_id).filter((id: string) => id !== exceptNurseId);
    if (!ids.length) return;
    const { data } = await db().from('app_users').select('id, fcm_token').in('id', ids).not('fcm_token', 'is', null);
    const targets = (data ?? []).map((u: { id: string; fcm_token: string }) => ({ userId: u.id, token: u.fcm_token }));
    await Promise.race([sendData(targets, { type: 'dismiss', bookingId }, 300), new Promise((r) => setTimeout(r, 4000))]);
  } catch (e) {
    console.error('[notify] dismiss failed', e);
  }
}
