import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/kashier';
import { applyKashierResult } from '@/lib/payments';
import { db } from '@/lib/db';

/** Kashier server-to-server notification. The signature is verified before anything is trusted. */
export async function POST(req: NextRequest) {
  let body: { event?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const data = body?.data ?? {};
  try {
    const valid = verifyWebhookSignature(data, req.headers.get('x-kashier-signature'));
    if (body.event !== 'pay') {
      await db().from('payment_events').insert({
        merchant_order_id: data.merchantOrderId ? String(data.merchantOrderId) : null, source: 'WEBHOOK',
        signature_valid: valid, result: `IGNORED_${String(body.event ?? 'unknown').toUpperCase()}`, payload: body,
      });
      return NextResponse.json({ ok: true });
    }
    const orderId = String(data.merchantOrderId ?? '');
    const status = String(data.status ?? '').toUpperCase();
    const result = await applyKashierResult('WEBHOOK', body, valid, orderId ? {
      orderId,
      success: status === 'SUCCESS',
      transactionId: data.transactionId ? String(data.transactionId) : null,
      providerOrderId: data.kashierOrderId ? String(data.kashierOrderId) : data.orderId ? String(data.orderId) : null,
      amount: data.amount != null ? Number(data.amount) : null,
      method: data.method ? String(data.method) : null,
    } : null);
    return NextResponse.json({ ok: valid, result }, { status: valid ? 200 : 401 });
  } catch (e) {
    console.error('[kashier webhook]', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
