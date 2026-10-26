'use client';
import { useState } from 'react';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { Card, ErrorBox, Field, Money, Spinner, StatusBadge } from '@/components/ui';
import { WALLET_TX_TYPES, WITHDRAWAL_METHODS, WITHDRAWAL_STATUS, dateTime } from '@/lib/shared/labels';

interface Wallet {
  balance: number; totalEarned: number; totalCommission: number; totalWithdrawn: number; minWithdrawal: number;
  transactions: Array<{ id: number; type: string; direction: string; amount: number; balanceAfter: number; description: string; createdAt: string }>;
  withdrawals: Array<{ id: string; amount: number; method: string; receivingAccount: string; status: string; adminNote: string | null; reference: string | null; createdAt: string }>;
  dues: Array<{ id: string; bookingId: string; code: string; amount: number; status: string; createdAt: string }>;
}

export default function WalletPage() {
  const { data: w, error, reload } = useApi<Wallet>('/api/v1/nurse/wallet');
  const [f, setF] = useState({ amount: '', method: 'VODAFONE_CASH', receivingAccount: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (error && !w) return <ErrorBox error={error} onRetry={reload} />;
  if (!w) return <Spinner />;

  const withdraw = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setMsg(null); setBusy(true);
    try {
      await api('/api/v1/nurse/withdrawals', { body: { amount: Number(f.amount), method: f.method, receivingAccount: f.receivingAccount } });
      setMsg('تم إرسال طلب السحب، وسيتم مراجعته وتحويله من الإدارة.'); setF({ ...f, amount: '' }); reload();
    } catch (e2) { setErr(errorMessage(e2)); } finally { setBusy(false); }
  };

  return (
    <>
      <h1>المحفظة</h1>
      <Card className="brand center">
        <div className="muted small">الرصيد المتاح</div>
        <div style={{ fontSize: '2rem', fontWeight: 800 }}><Money v={w.balance} /></div>
      </Card>
      <div className="grid3">
        <div className="card center"><div className="small muted">إجمالي الأرباح</div><strong><Money v={w.totalEarned} /></strong></div>
        <div className="card center"><div className="small muted">عمولة المنصة</div><strong><Money v={w.totalCommission} /></strong></div>
        <div className="card center"><div className="small muted">تم سحبه</div><strong><Money v={w.totalWithdrawn} /></strong></div>
      </div>

      <form className="card stack" onSubmit={withdraw}>
        <h3>طلب سحب</h3>
        {msg && <div className="alert ok">{msg}</div>}
        <ErrorBox error={err} />
        <Field label="المبلغ" hint={`الحد الأدنى ${w.minWithdrawal} ج.م`}>
          <input type="number" min={w.minWithdrawal} max={w.balance} step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
        </Field>
        <Field label="طريقة الاستلام">
          <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            {Object.entries(WITHDRAWAL_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label={f.method === 'BANK_TRANSFER' ? 'رقم الحساب / IBAN واسم البنك' : f.method === 'INSTAPAY' ? 'عنوان إنستاباي أو رقم الموبايل' : 'رقم المحفظة'}>
          <input value={f.receivingAccount} onChange={(e) => setF({ ...f, receivingAccount: e.target.value })} required minLength={5} maxLength={120} />
        </Field>
        <button className="btn block" disabled={busy || w.balance < w.minWithdrawal}>{busy ? '...' : 'إرسال طلب السحب'}</button>
        {w.balance < w.minWithdrawal && <p className="small muted">الرصيد أقل من الحد الأدنى للسحب.</p>}
      </form>

      {w.withdrawals.length > 0 && (
        <Card>
          <h3>طلبات السحب</h3>
          {w.withdrawals.map((x) => (
            <div key={x.id} className="list-item">
              <div><strong><Money v={x.amount} /></strong> • {WITHDRAWAL_METHODS[x.method]}<div className="small muted">{dateTime(x.createdAt)}{x.reference ? ` • مرجع ${x.reference}` : ''}{x.adminNote ? ` • ${x.adminNote}` : ''}</div></div>
              <StatusBadge status={x.status} labels={WITHDRAWAL_STATUS} />
            </div>
          ))}
        </Card>
      )}

      {w.dues.length > 0 && (
        <Card>
          <h3>مبالغ مستحقة على العملاء</h3>
          {w.dues.map((d) => (
            <a key={d.id} className="list-item" href={`/app/nurse/jobs/${d.bookingId}`}>
              <div>{d.code}<div className="small muted">{dateTime(d.createdAt)}</div></div>
              <div><Money v={d.amount} /> <span className={`badge ${d.status === 'OPEN' ? 'warn' : 'ok'}`}>{d.status === 'OPEN' ? 'لم يُحصّل' : 'تم التحصيل'}</span></div>
            </a>
          ))}
        </Card>
      )}

      <Card>
        <h3>حركة المحفظة</h3>
        {w.transactions.length === 0 && <p className="muted small">لا توجد حركات بعد</p>}
        {w.transactions.map((t) => (
          <div key={t.id} className="list-item">
            <div><strong>{WALLET_TX_TYPES[t.type] ?? t.type}</strong><div className="small muted">{t.description} • {dateTime(t.createdAt)}</div></div>
            <div style={{ textAlign: 'left' }}>
              <strong style={{ color: t.direction === 'CREDIT' ? 'var(--ok)' : t.direction === 'DEBIT' ? 'var(--danger)' : 'var(--muted)' }}>
                {t.direction === 'CREDIT' ? '+' : t.direction === 'DEBIT' ? '−' : ''}<Money v={t.amount} />
              </strong>
              <div className="small muted">الرصيد: <Money v={t.balanceAfter} /></div>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
