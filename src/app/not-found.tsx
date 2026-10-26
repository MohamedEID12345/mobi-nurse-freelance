import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="app-shell"><div className="app-content center">
      <h1>الصفحة غير موجودة</h1>
      <Link className="btn" href="/">الرئيسية</Link>
    </div></div>
  );
}
