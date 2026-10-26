import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getLang } from '@/lib/lang';

export const metadata: Metadata = {
  title: 'MOBI-NURSE — ممرضك الأمين لحد باب بيتك',
  description: 'تمريض منزلي موثوق: اطلب ممرض/ة معتمد/ة لحد باب بيتك. Trusted home nursing in Egypt.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  openGraph: { title: 'MOBI-NURSE', description: 'ممرضك الأمين لحد باب بيتك', images: ['/icon-512.png'] },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#077DBA' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1120' },
  ],
};

// Applies the saved/system theme before first paint (no flash).
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('mn_theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}document.documentElement.classList.add('js')})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
