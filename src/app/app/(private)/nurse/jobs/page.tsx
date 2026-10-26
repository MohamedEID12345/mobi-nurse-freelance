'use client';
import Link from 'next/link';
import { useApi } from '@/client/hooks';
import { Empty, ErrorBox, Money, Spinner, StatusBadge } from '@/components/ui';
import { dateTime } from '@/lib/shared/labels';

interface J { id: string; code: string; status: string; serviceName: string; patientName: string; nurseAmount: number; createdAt: string; scheduledAt: string | null }

export default function Jobs() {
  const { data, error, loading, reload } = useApi<J[]>('/api/v1/nurse/jobs');
  const earned = (data ?? []).filter((j) => j.status === 'PAID').reduce((s, j) => s + j.nurseAmount, 0);
  return (
    <>
      <h1>مهامي</h1>
      <ErrorBox error={error} onRetry={reload} />
      {loading && <Spinner />}
      {data && <div className="card row between"><span>أرباح المهام المدفوعة (آخر 100)</span><span className="total"><Money v={earned} /></span></div>}
      {data && data.length === 0 && <Empty>لا توجد مهام بعد</Empty>}
      <div className="card">
        {(data ?? []).map((j) => (
          <Link key={j.id} href={`/app/nurse/jobs/${j.id}`} className="list-item">
            <div><strong>{j.serviceName}</strong><div className="small muted">{j.patientName} • {j.code} • {dateTime(j.scheduledAt ?? j.createdAt)}</div></div>
            <div style={{ textAlign: 'left' }}><StatusBadge status={j.status} /><div className="small"><Money v={j.nurseAmount} /></div></div>
          </Link>
        ))}
      </div>
    </>
  );
}
