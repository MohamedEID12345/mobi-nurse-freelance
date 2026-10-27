'use client';
import { useEffect, useState } from 'react';
import { alertStatus, AlertStatus, isAndroidApp, nativeBridge, playRequestSound } from '@/client/native';
import { Card } from './ui';

/** Lets the nurse check and fix everything needed to hear new nearby requests. */
export function NurseAlertsCard({ online }: { online: boolean }) {
  const [inApp, setInApp] = useState(false);
  const [st, setSt] = useState<AlertStatus | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInApp(isAndroidApp());
    const refresh = () => setSt(alertStatus());
    refresh();
    const onVis = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVis);
    const t = setInterval(refresh, 5000);
    return () => { document.removeEventListener('visibilitychange', onVis); clearInterval(t); };
  }, []);

  if (!inApp) {
    return (
      <Card className="stack">
        <h3>🔔 تنبيهات الطلبات</h3>
        <p className="small muted">على المتصفح يصلك التنبيه والصفحة مفتوحة فقط. لتصلك الطلبات القريبة <strong>بصوت مميز حتى والتطبيق مقفول</strong> استخدم تطبيق الأندرويد.</p>
        <button className="btn secondary block" onClick={playRequestSound}>🔊 اسمع صوت التنبيه</button>
      </Card>
    );
  }

  const b = nativeBridge();
  const problems = st ? [!st.push, !st.permission, !st.battery, online && !st.background].filter(Boolean).length : 0;
  const Row = ({ ok, label, fix, action }: { ok: boolean; label: string; fix?: string; action?: () => void }) => (
    <div className="list-item">
      <span>{ok ? '✅' : '⚠️'} {label}</span>
      {!ok && action && <button className="btn sm secondary" onClick={action}>{fix}</button>}
    </div>
  );

  return (
    <Card className="stack">
      <div className="row between" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        <h3 style={{ margin: 0 }}>🔔 تنبيهات الطلبات</h3>
        {st && (problems === 0 ? <span className="badge ok">جاهزة</span> : <span className="badge warn">{problems} تحتاج ضبط</span>)}
      </div>
      {(open || problems > 0) && st && (
        <>
          <Row ok={st.push} label="خدمة الإشعارات (Firebase)" />
          {!st.push && <p className="small muted">الإشعارات وأنت قافل التطبيق غير مفعّلة على السيرفر بعد — تواصل مع الإدارة.</p>}
          <Row ok={st.permission} label="السماح بالإشعارات والصوت" fix="تفعيل" action={() => b?.enableNotifications?.()} />
          <Row ok={st.battery} label="استثناء التطبيق من توفير البطارية" fix="ضبط" action={() => b?.openBatterySettings?.()} />
          {online && <Row ok={st.background} label="استقبال الطلبات في الخلفية" />}
          <p className="small muted">اختر «بدون قيود / Unrestricted» للتطبيق في إعدادات البطارية حتى لا يوقفه الهاتف.</p>
        </>
      )}
      <div className="grid2">
        <button className="btn secondary" onClick={() => b?.testAlert?.('🚨 تجربة: طلب تمريض قريب', 'هذا هو صوت تنبيه الطلبات الجديدة')}>🔊 تجربة التنبيه</button>
        <button className="btn ghost" onClick={() => b?.openNotificationSettings?.()}>إعدادات الصوت</button>
      </div>
    </Card>
  );
}
