import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function PublicAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell" style={{ paddingBottom: 24 }}>
      <div className="app-header"><Link href="/"><Logo height={34} /></Link>
        <a className="small" href="https://wa.me/201062569857">الدعم</a></div>
      {children}
    </div>
  );
}
