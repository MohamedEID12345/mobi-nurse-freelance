import { db } from '@/lib/db';
import { handler, ok } from '@/lib/http';
import { pushEnabled } from '@/lib/fcm';

export const GET = handler(async () => {
  const { error } = await db().from('settings').select('key', { head: true, count: 'exact' });
  return ok({
    database: error ? `error: ${error.message}` : 'ok',
    kashier: Boolean(process.env.KASHIER_MERCHANT_ID && process.env.KASHIER_API_KEY) ? process.env.KASHIER_MODE ?? 'test' : 'not configured',
    push: pushEnabled() ? 'enabled' : 'not configured',
  });
});
