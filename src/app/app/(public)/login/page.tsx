'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, errorMessage } from '@/client/api';
import { Card, ErrorBox, Field } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api<{ user: { role: string } }>('/api/v1/auth/login', { body: { phone, password } });
      const next = sp.get('next');
      router.replace(next && next.startsWith('/app') ? next : r.user.role === 'NURSE' ? '/app/nurse' : '/app');
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="app-content" onSubmit={submit}>
      <h1>تسجيل الدخول</h1>
      <ErrorBox error={error} />
      <Card className="stack">
        <Field label="رقم الموبايل"><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01xxxxxxxxx" required /></Field>
        <Field label="كلمة المرور"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></Field>
        <button className="btn block lg" disabled={busy}>{busy ? '...' : 'دخول'}</button>
      </Card>
      <Link className="btn block secondary" href="/app/register">ليس لديك حساب؟ سجّل الآن</Link>
      <Link className="btn block danger" href="/urgent">🚨 طلب تمريض عاجل بدون تسجيل</Link>
      <p className="small muted center">نسيت كلمة المرور؟ تواصل مع <a href="https://wa.me/201062569857">الدعم على واتساب</a></p>
    </form>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
