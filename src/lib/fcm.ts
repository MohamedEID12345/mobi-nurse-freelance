import { importPKCS8, SignJWT } from 'jose';
import { db } from './db';
import { env } from './env';

interface ServiceAccount { client_email: string; private_key: string; project_id: string }

let account: ServiceAccount | null | undefined;
let cachedToken: { token: string; exp: number } | null = null;

function serviceAccount(): ServiceAccount | null {
  if (account !== undefined) return account;
  const b64 = env.fcmServiceAccountBase64;
  if (!b64) return (account = null);
  try {
    account = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as ServiceAccount;
  } catch {
    console.error('[fcm] FCM_SERVICE_ACCOUNT_BASE64 is not valid base64 JSON');
    account = null;
  }
  return account;
}

async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const key = await importPKCS8(sa.private_key, 'RS256');
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!res.ok) throw new Error(`oauth ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export function pushEnabled(): boolean {
  return serviceAccount() !== null;
}

/** Sends a push to Android devices. Silently does nothing if Firebase is not configured. */
export async function sendPush(targets: Array<{ userId: string; token: string }>,
                               msg: { title: string; body: string; link?: string; channel?: 'requests' | 'general' }) {
  const sa = serviceAccount();
  if (!sa || targets.length === 0) return;
  try {
    const bearer = await accessToken(sa);
    await Promise.all(targets.map(async (t) => {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: t.token,
            data: { title: msg.title, body: msg.body, link: msg.link ?? '/app', channel: msg.channel ?? 'general' },
            android: { priority: 'high', ttl: msg.channel === 'requests' ? '120s' : '86400s' },
          },
        }),
      });
      if (res.status === 404 || res.status === 400) {
        const text = await res.text();
        if (text.includes('UNREGISTERED') || text.includes('INVALID_ARGUMENT')) {
          await db().from('app_users').update({ fcm_token: null }).eq('id', t.userId).eq('fcm_token', t.token);
        }
      }
    }));
  } catch (e) {
    console.error('[fcm] send failed', e);
  }
}
