'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/client/api';
import { useApi } from '@/client/hooks';
import { qs } from '@/components/admin';
import { ErrorBox, Money, Spinner } from '@/components/ui';
import { dateTime } from '@/lib/shared/labels';
import { whatsappLink } from '@/lib/shared/phone';

interface Dash {
  stats: Record<string, number>;
  pendingNurses: Array<{ id: string; name: string; phone: string; submittedAt: string }>;
  longSearches: Array<{ id: string; code: string; service_name_ar: string; search_started_at: string; is_urgent: boolean }>;
  adminWhatsapp: string;
}

const RANGES: Array<[string, string]> = [['today', 'اليوم'], ['yesterday', 'أمس'], ['week', 'هذا الأسبوع'], ['month', 'هذا الشهر'], ['custom', 'مخصص']];

export default function Dashboard() {
  const [range, setRange] = useState('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [gov, setGov] = useState('');
  const [govs, setGovs] = useState<Array<{ id: string; nameAr: string }>>([]);
  useEffect(() => { api('/api/v1/meta').then((m) => setGovs(m.governorates)).catch(() => undefined); }, []);
  const path = `/api/v1/admin/dashboard${qs({ range, from: range === 'custom' ? from : null, to: range === 'custom' ? to : null, governorateId: gov })}`;
  const { data, error, reload } = useApi<Dash>(range === 'custom' && (!from || !to) ? null : path, { poll: 60000 });
  const s = data?.stats ?? {};
  const stat = (k: string, l: string, money = false, alertIf = false) => (
    <div className={`stat ${alertIf && Number(s[k]) > 0 ? 'alert-stat' : ''}`}><div className="n">{money ? <Money v={s[k]} /> : (s[k] ?? '—')}</div><div className="l">{l}</div></div>
  );

  return (
    <>
      <div className="admin-top"><h1>لوحة المؤشرات</h1></div>
      <div className="filters">
        <div className="tabs" style={{ margin: 0 }}>{RANGES.map(([k, l]) => <button key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{l}</button>)}</div>
        {range === 'custom' && <><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></>}
        <select value={gov} onChange={(e) => setGov(e.target.value)}><option value="">كل المحافظات</option>{govs.map((g) => <option key={g.id} value={g.id}>{g.nameAr}</option>)}</select>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {!data && !error && <Spinner />}
      {data && (
        <>
          {s.pending_verifications > 0 && (
            <div className="alert warn row between" style={{ marginBottom: '1rem' }}>
              <strong>🔔 يوجد {s.pending_verifications} ممرض/ة بانتظار التحقق</strong>
              <Link className="btn sm" href="/admin/nurses?status=PENDING_VERIFICATION">مراجعة الآن</Link>
            </div>
          )}
          <div className="grid-auto">
            {stat('bookings_in_range', 'طلبات الفترة')}
            {stat('active_bookings', 'طلبات جارية')}
            {stat('completed_bookings', 'طلبات مكتملة ومدفوعة')}
            {stat('cancelled_bookings', 'طلبات ملغاة')}
            {stat('searching_too_long', 'طلبات تبحث منذ +10 دقائق', false, true)}
            {stat('online_nurses', 'ممرضون متصلون الآن')}
            {stat('approved_nurses', 'ممرضون معتمدون')}
            {stat('total_nurses', 'إجمالي الممرضين')}
            {stat('pending_verifications', 'بانتظار التحقق', false, true)}
            {stat('customers', 'العملاء')}
            {stat('gross_revenue', 'قيمة الخدمات المدفوعة', true)}
            {stat('commission', 'عمولة MOBI', true)}
            {stat('registration_fees', 'رسوم التفعيل', true)}
            {stat('pending_withdrawals', 'طلبات سحب مفتوحة', false, true)}
            {stat('open_complaints', 'شكاوى مفتوحة', false, true)}
            {stat('payment_issues', 'مشكلات دفع (30 يوم)', false, true)}
          </div>
          <div className="grid2" style={{ marginTop: '1rem' }}>
            <div className="card">
              <h3>بانتظار التحقق</h3>
              {data.pendingNurses.length === 0 && <p className="muted small">لا يوجد</p>}
              {data.pendingNurses.map((n) => (
                <div key={n.id} className="list-item">
                  <Link href={`/admin/nurses/${n.id}`}><strong>{n.name}</strong><div className="small muted">{n.phone} • {dateTime(n.submittedAt)}</div></Link>
                  <a className="btn sm whatsapp" target="_blank" rel="noreferrer"
                     href={whatsappLink(data.adminWhatsapp, `ممرض/ة جديد/ة بانتظار التحقق: ${n.name} (${n.phone})`)}>واتساب</a>
                </div>
              ))}
            </div>
            <div className="card">
              <h3>طلبات تحتاج تدخل</h3>
              {data.longSearches.length === 0 && <p className="muted small">لا يوجد</p>}
              {data.longSearches.map((b) => (
                <Link key={b.id} href={`/admin/bookings/${b.id}`} className="list-item">
                  <div><strong>{b.is_urgent ? '🚨 ' : ''}{b.service_name_ar}</strong><div className="small muted">{b.code} • يبحث منذ {dateTime(b.search_started_at)}</div></div><span>‹</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
