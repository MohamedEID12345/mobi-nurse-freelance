import Link from 'next/link';
import { db } from '@/lib/db';
import { verifyRedirectSignature } from '@/lib/kashier';
import { applyKashierResult } from '@/lib/payments';
import { money } from '@/lib/shared/labels';
import { Logo } from '@/components/Logo';

export const dynamic = 'force-dynamic';

/** Kashier redirects the payer here. The signature is verified server-side before anything is applied. */
export default async function PayResult({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const entries = Object.entries(sp).flatMap(([k, v]) => (v === undefined ? [] : [[k, Array.isArray(v) ? v[0] : v] as [string, string]]));
  const get = (k: string) => entries.find(([key]) => key === k)?.[1] ?? null;
  const orderId = get('merchantOrderId');

  let state: 'success' | 'failed' | 'invalid' | 'error' = 'invalid';
  let link = '/app';
  let amount: string | null = null;
  try {
    if (orderId) {
      const valid = verifyRedirectSignature(entries);
      const success = get('paymentStatus')?.toUpperCase() === 'SUCCESS';
      const result = await applyKashierResult('REDIRECT', Object.fromEntries(entries), valid, {
        orderId, success, transactionId: get('transactionId'), providerOrderId: get('orderId'),
        amount: get('amount') ? Number(get('amount')) : null, method: get('cardBrand'),
      });
      state = !valid ? 'invalid' : success && ['OK', 'ALREADY_PROCESSED'].includes(result) ? 'success' : success ? 'error' : 'failed';
      const { data: p } = await db().from('payments').select('purpose, booking_id, payer_type, amount').eq('merchant_order_id', orderId).maybeSingle();
      if (p) {
        amount = p.amount;
        if (p.purpose === 'REGISTRATION_FEE') link = '/app/nurse';
        else if (p.payer_type === 'NURSE') link = `/app/nurse/jobs/${p.booking_id}`;
        else if (p.payer_type === 'GUEST') link = '/urgent/track';
        else link = `/app/bookings/${p.booking_id}`;
      }
    }
  } catch (e) {
    console.error('[pay/result]', e);
    state = 'error';
  }

  const view = {
    success: { icon: '✅', title: 'تم الدفع بنجاح', text: `تم تأكيد الدفع${amount ? ` بقيمة ${money(amount)}` : ''}. شكراً لك!`, cls: 'ok' },
    failed: { icon: '❌', title: 'لم تتم عملية الدفع', text: 'لم يتم خصم أي مبلغ. يمكنك المحاولة مرة أخرى.', cls: 'danger' },
    invalid: { icon: '⚠️', title: 'تعذر التحقق من العملية', text: 'إذا تم خصم مبلغ تواصل مع الدعم على واتساب وسيتم مراجعته.', cls: 'warn' },
    error: { icon: '⚠️', title: 'جارٍ مراجعة العملية', text: 'استلمنا نتيجة الدفع وسيتم تأكيدها خلال دقائق. تابع حالة الطلب من التطبيق.', cls: 'warn' },
  }[state];

  return (
    <div className="app-shell"><div className="app-content">
      <div className="center" style={{ margin: '1rem 0' }}><Logo width={180} /></div>
      <div className={`card center stack`}>
        <div style={{ fontSize: '3rem' }}>{view.icon}</div>
        <h1>{view.title}</h1>
        <div className={`alert ${view.cls}`}>{view.text}</div>
        {orderId && <p className="muted small">رقم العملية: <span className="ltr">{orderId}</span></p>}
        <Link className="btn block lg" href={link}>العودة للتطبيق</Link>
        <a className="btn block whatsapp" href="https://wa.me/201062569857">الدعم على واتساب</a>
      </div>
    </div></div>
  );
}
