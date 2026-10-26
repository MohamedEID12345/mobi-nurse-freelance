import crypto from 'node:crypto';
import querystring from 'node:querystring';
import { env } from './env';

const CHECKOUT_BASE = 'https://checkout.kashier.io/';

function hmac(data: string): string {
  return crypto.createHmac('sha256', env.kashierApiKey).update(data).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/** Kashier Hosted Payment Page URL (cards + e-wallets). */
export function buildCheckoutUrl(opts: { orderId: string; amount: number; customerReference?: string }): string {
  const mid = env.kashierMerchantId;
  const amount = formatAmount(opts.amount);
  const currency = 'EGP';
  const hash = hmac(`/?payment=${mid}.${opts.orderId}.${amount}.${currency}`);
  const params = new URLSearchParams({
    merchantId: mid,
    orderId: opts.orderId,
    amount,
    currency,
    hash,
    mode: env.kashierMode,
    merchantRedirect: `${env.appUrl}/pay/result`,
    serverWebhook: `${env.appUrl}/api/v1/payments/kashier/webhook`,
    failureRedirect: 'true',
    redirectMethod: 'get',
    allowedMethods: 'card,wallet',
    display: 'ar',
    brandColor: '#077DBA',
  });
  if (opts.customerReference) params.set('customerReference', opts.customerReference);
  return `${CHECKOUT_BASE}?${params.toString()}`;
}

/** Validates the signature Kashier appends to the merchant redirect URL. Params must be in received order. */
export function verifyRedirectSignature(entries: Array<[string, string]>): boolean {
  const sig = entries.find(([k]) => k === 'signature')?.[1] ?? '';
  const payload = entries.filter(([k]) => k !== 'signature' && k !== 'mode').map(([k, v]) => `${k}=${v}`).join('&');
  return safeEqualHex(hmac(payload), sig);
}

/** Validates the x-kashier-signature header of a webhook call. */
export function verifyWebhookSignature(data: Record<string, unknown>, headerSignature: string | null): boolean {
  if (!headerSignature || !Array.isArray(data.signatureKeys)) return false;
  const keys = [...(data.signatureKeys as string[])].sort();
  const picked: Record<string, string> = {};
  for (const k of keys) {
    const v = data[k];
    picked[k] = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  }
  return safeEqualHex(hmac(querystring.stringify(picked)), headerSignature);
}
