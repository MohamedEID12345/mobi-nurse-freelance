'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionProvider, useSession } from '@/components/session';
import { useApi } from '@/client/hooks';
import { Logo } from '@/components/Logo';

const CUSTOMER_NAV = [
  { href: '/app', ico: '🏠', label: 'الرئيسية' },
  { href: '/app/bookings', ico: '📋', label: 'طلباتي' },
  { href: '/app/family', ico: '👨‍👩‍👧', label: 'الأسرة' },
  { href: '/app/payments', ico: '💳', label: 'المدفوعات' },
  { href: '/app/account', ico: '👤', label: 'حسابي' },
];
const NURSE_NAV = [
  { href: '/app/nurse', ico: '🏠', label: 'الرئيسية' },
  { href: '/app/nurse/jobs', ico: '📋', label: 'مهامي' },
  { href: '/app/nurse/wallet', ico: '💰', label: 'المحفظة' },
  { href: '/app/nurse/profile', ico: '⭐', label: 'ملفي' },
  { href: '/app/account', ico: '👤', label: 'حسابي' },
];

function Frame({ children }: { children: React.ReactNode }) {
  const { me } = useSession();
  const path = usePathname();
  const unread = useApi<{ unread: number }>('/api/v1/notifications', { poll: 30000 });
  const nav = me.role === 'NURSE' ? NURSE_NAV : CUSTOMER_NAV;
  const home = me.role === 'NURSE' ? '/app/nurse' : '/app';
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href={home}><Logo height={34} /></Link>
        <div className="row">
          <a href="https://wa.me/201062569857" className="small" aria-label="الدعم">💬 الدعم</a>
          <Link href="/app/notifications" className="bell" aria-label="الإشعارات">🔔{unread.data?.unread ? <span className="dot">{unread.data.unread}</span> : null}</Link>
        </div>
      </header>
      <main className="app-content">{children}</main>
      <nav className="bottom-nav"><div className="inner">
        {nav.map((n) => {
          const active = n.href === home ? path === home : path.startsWith(n.href);
          return <Link key={n.href} href={n.href} className={active ? 'active' : ''}><span className="ico">{n.ico}</span>{n.label}</Link>;
        })}
      </div></nav>
    </div>
  );
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider><Frame>{children}</Frame></SessionProvider>;
}
