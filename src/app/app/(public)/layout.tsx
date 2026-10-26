import Link from 'next/link';

export default function PublicAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell" style={{ paddingBottom: 24 }}>
      <div className="app-header"><Link href="/"><img src="/logo.png" alt="MOBI-NURSE" /></Link>
        <a className="small" href="https://wa.me/201062569857">الدعم</a></div>
      {children}
    </div>
  );
}
