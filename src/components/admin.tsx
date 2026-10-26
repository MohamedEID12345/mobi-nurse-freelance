'use client';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { ErrorBox, Spinner } from './ui';
import { ADMIN_ROLES } from '@/lib/shared/labels';
import type { Permission } from '@/lib/shared/permissions';
import { Logo } from '@/components/Logo';

export interface AdminMe { id: string; email: string; fullName: string; role: string; mustChangePassword: boolean; permissions: Permission[] }

const Ctx = createContext<AdminMe | null>(null);
export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAdmin outside provider');
  return c;
}
export function useCan() {
  const me = useAdmin();
  return (p: Permission) => me.permissions.includes(p);
}

const NAV: Array<{ href: string; label: string; ico: string; perm: Permission; badge?: string }> = [
  { href: '/admin', label: 'لوحة المؤشرات', ico: '📊', perm: 'DASHBOARD_VIEW' },
  { href: '/admin/operations', label: 'التشغيل المباشر', ico: '🛰️', perm: 'OPERATIONS_VIEW' },
  { href: '/admin/nurses', label: 'الممرضون', ico: '👩‍⚕️', perm: 'NURSES_MANAGE', badge: 'pending_verifications' },
  { href: '/admin/customers', label: 'العملاء', ico: '👥', perm: 'CUSTOMERS_MANAGE' },
  { href: '/admin/bookings', label: 'الطلبات', ico: '📋', perm: 'BOOKINGS_VIEW', badge: 'searching_too_long' },
  { href: '/admin/finance', label: 'المالية', ico: '💵', perm: 'FINANCE_VIEW', badge: 'payment_issues' },
  { href: '/admin/withdrawals', label: 'طلبات السحب', ico: '🏦', perm: 'FINANCE_VIEW', badge: 'pending_withdrawals' },
  { href: '/admin/complaints', label: 'الشكاوى', ico: '📝', perm: 'COMPLAINTS_MANAGE', badge: 'open_complaints' },
  { href: '/admin/services', label: 'الخدمات والأسعار', ico: '🩺', perm: 'SERVICES_MANAGE' },
  { href: '/admin/governorates', label: 'المحافظات', ico: '🗺️', perm: 'GOVERNORATES_MANAGE' },
  { href: '/admin/settings', label: 'الإعدادات والسياسات', ico: '⚙️', perm: 'SETTINGS_MANAGE' },
  { href: '/admin/admins', label: 'المشرفون', ico: '🛡️', perm: 'ADMINS_MANAGE' },
  { href: '/admin/audit', label: 'سجل العمليات', ico: '🧾', perm: 'AUDIT_VIEW' },
];

function Sidebar({ me }: { me: AdminMe }) {
  const path = usePathname();
  const stats = useApi<{ stats: Record<string, number> }>(me.permissions.includes('DASHBOARD_VIEW') ? '/api/v1/admin/dashboard' : null, { poll: 60000 });
  return (
    <aside className="admin-side">
      <Logo />
      {NAV.filter((n) => me.permissions.includes(n.perm)).map((n) => {
        const count = n.badge ? Number(stats.data?.stats?.[n.badge] ?? 0) : 0;
        const active = n.href === '/admin' ? path === '/admin' : path.startsWith(n.href);
        return <Link key={n.href} href={n.href} className={active ? 'active' : ''}>{n.ico} {n.label}{count > 0 && <span className="count">{count}</span>}</Link>;
      })}
      <div style={{ marginTop: '1rem', fontSize: '.8rem', color: '#9ca3af', padding: '0 .7rem' }}>
        {me.fullName}<br />{ADMIN_ROLES[me.role]}
      </div>
      <a href="#" onClick={async (e) => { e.preventDefault(); await api('/api/v1/admin/auth/logout', { body: {} }).catch(() => undefined); window.location.href = '/admin/login'; }}>🚪 خروج</a>
    </aside>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<AdminMe>('/api/v1/admin/auth/me').then((m) => {
      if (m.mustChangePassword) router.replace('/admin/change-password'); else setMe(m);
    }).catch((e) => setError(errorMessage(e)));
  }, [router]);
  if (error) return <div style={{ padding: '2rem' }}><ErrorBox error={error} /></div>;
  if (!me) return <Spinner />;
  return (
    <Ctx.Provider value={me}>
      <div className="admin">
        <Sidebar me={me} />
        <main className="admin-main">{children}</main>
      </div>
    </Ctx.Provider>
  );
}

export interface Column<T> { label: string; render: (row: T) => ReactNode }

export function Table<T>({ rows, columns, onRow, empty = 'لا توجد بيانات' }: { rows: T[]; columns: Column<T>[]; onRow?: (r: T) => void; empty?: string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={columns.length} className="center muted">{empty}</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} className={onRow ? 'clickable' : ''} onClick={() => onRow?.(r)}>
              {columns.map((c) => <td key={c.label}>{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ page, total, size = 30, onPage }: { page: number; total: number; size?: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pager">
      <button className="btn sm ghost" disabled={page <= 0} onClick={() => onPage(page - 1)}>السابق</button>
      <span className="small muted">صفحة {page + 1} من {pages} • {total} سجل</span>
      <button className="btn sm ghost" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>التالي</button>
    </div>
  );
}

export function qs(params: Record<string, string | number | null | undefined>): string {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') u.set(k, String(v)); });
  const s = u.toString();
  return s ? `?${s}` : '';
}
