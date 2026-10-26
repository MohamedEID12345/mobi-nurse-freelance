import { db } from './db';
import { env } from './env';
import { ApiError, ConfigError, must } from './http';
import { buildCheckoutUrl } from './kashier';
import { shortCode } from './codes';
import { notify } from './notify';
import { money } from './shared/labels';

function assertGatewayConfigured() {
  try {
    void env.kashierMerchantId;
    void env.kashierApiKey;
    void env.appUrl;
  } catch (e) {
    if (e instanceof ConfigError) throw new ApiError('PAYMENT_UNAVAILABLE', undefined, e.message);
    throw e;
  }
}

/** Creates a PENDING payment and returns the Kashier hosted checkout URL. The amount always comes from the DB. */
export async function startPayment(opts: {
  purpose: 'BOOKING' | 'REGISTRATION_FEE';
  bookingId?: string;
  nurseId?: string;
  payerType: 'CUSTOMER' | 'GUEST' | 'NURSE';
  payerUserId: string | null;
  amount: number;
}): Promise<{ url: string; orderId: string }> {
  assertGatewayConfigured();
  if (!(opts.amount > 0)) throw new ApiError('NOT_PAYABLE');
  const orderId = shortCode('MNP', 12);
  must(await db().from('payments').insert({
    merchant_order_id: orderId,
    purpose: opts.purpose,
    booking_id: opts.bookingId ?? null,
    nurse_id: opts.nurseId ?? null,
    payer_type: opts.payerType,
    payer_user_id: opts.payerUserId,
    amount: opts.amount,
  }));
  return { orderId, url: buildCheckoutUrl({ orderId, amount: opts.amount, customerReference: opts.payerUserId ?? undefined }) };
}

export interface KashierResult {
  orderId: string;
  success: boolean;
  transactionId: string | null;
  providerOrderId: string | null;
  amount: number | null;
  method: string | null;
}

/** Idempotent: webhook and redirect can both call this; the DB function applies a success only once. */
export async function applyKashierResult(source: 'WEBHOOK' | 'REDIRECT', payload: unknown, signatureValid: boolean,
                                         r: KashierResult | null): Promise<string> {
  let result = 'INVALID_SIGNATURE';
  if (signatureValid && r) {
    if (r.success) {
      result = String(must(await db().rpc('mn_apply_payment_success', {
        p_order: r.orderId, p_txn: r.transactionId, p_amount: r.amount, p_provider_order: r.providerOrderId, p_method: r.method,
      })));
      if (result === 'OK') await notifyPaid(r.orderId);
    } else {
      await db().rpc('mn_mark_payment_failed', { p_order: r.orderId, p_reason: 'DECLINED' });
      result = 'FAILED';
    }
  }
  await db().from('payment_events').insert({
    merchant_order_id: r?.orderId ?? null, source, signature_valid: signatureValid, result, payload: payload as object,
  });
  return result;
}

async function notifyPaid(orderId: string) {
  const p = must(await db().from('payments').select('purpose, booking_id, nurse_id, amount, payer_type')
    .eq('merchant_order_id', orderId).single()) as { purpose: string; booking_id: string | null; nurse_id: string | null; amount: string; payer_type: string };
  if (p.purpose === 'REGISTRATION_FEE') {
    await notify([p.nurse_id], { title: 'تم سداد رسوم التفعيل', body: 'شكراً لك! بعد رفع المستندات سيتم مراجعة حسابك.', link: '/app/nurse' });
    return;
  }
  const b = must(await db().from('bookings').select('id, code, customer_id, nurse_id, nurse_amount').eq('id', p.booking_id).single()) as
    { id: string; code: string; customer_id: string | null; nurse_id: string; nurse_amount: string };
  await notify([b.customer_id], { title: 'تم الدفع بنجاح', body: `تم دفع ${money(p.amount)} للطلب ${b.code}. شكراً لك! قيّم الخدمة الآن.`, link: `/app/bookings/${b.id}` });
  await notify([b.nurse_id], { title: 'تم استلام الدفع', body: `أُضيف ${money(b.nurse_amount)} إلى محفظتك (طلب ${b.code}).`, link: '/app/nurse/wallet' });
}
