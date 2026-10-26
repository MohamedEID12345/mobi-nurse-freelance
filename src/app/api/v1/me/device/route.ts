import { db } from '@/lib/db';
import { handler, ok, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { deviceSchema } from '@/lib/validators';

/** Registers the Android FCM token for push notifications. */
export const POST = handler(async (req) => {
  const user = await requireUser(req);
  const { fcmToken } = await parseBody(req, deviceSchema);
  if (fcmToken) await db().from('app_users').update({ fcm_token: null }).eq('fcm_token', fcmToken).neq('id', user.id);
  await db().from('app_users').update({ fcm_token: fcmToken }).eq('id', user.id);
  return ok();
});
