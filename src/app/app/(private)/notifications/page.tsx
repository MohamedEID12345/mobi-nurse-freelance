'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/client/api';
import { useApi } from '@/client/hooks';
import { Empty, ErrorBox, Spinner } from '@/components/ui';
import { dateTime } from '@/lib/shared/labels';

interface N { id: number; title: string; body: string; link: string | null; read: boolean; createdAt: string }

export default function Notifications() {
  const { data, error, loading, reload } = useApi<{ unread: number; items: N[] }>('/api/v1/notifications');
  useEffect(() => { if (data?.unread) api('/api/v1/notifications', { body: {} }).catch(() => undefined); }, [data?.unread]);
  return (
    <>
      <h1>الإشعارات</h1>
      <ErrorBox error={error} onRetry={reload} />
      {loading && <Spinner />}
      {data && data.items.length === 0 && <Empty>لا توجد إشعارات</Empty>}
      <div className="card">
        {(data?.items ?? []).map((n) => {
          const inner = (<div><strong>{!n.read && '🔵 '}{n.title}</strong><div className="small">{n.body}</div><div className="small muted">{dateTime(n.createdAt)}</div></div>);
          return n.link ? <Link key={n.id} href={n.link} className="list-item">{inner}<span>‹</span></Link> : <div key={n.id} className="list-item">{inner}</div>;
        })}
      </div>
    </>
  );
}
