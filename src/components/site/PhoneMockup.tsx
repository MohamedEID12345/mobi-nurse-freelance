import { Icon } from './Icons';
import type { Dict } from '@/lib/shared/i18n';

/** Original in-app preview built with HTML/CSS (no screenshots). */
export function PhoneMockup({ t, compact = false }: { t: Dict; compact?: boolean }) {
  const p = t.hero.phone;
  return (
    <div className={`phone ${compact ? 'compact' : ''}`}>
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="ph-top">
          <img className="logo-img for-light" src="/logo-light.png" alt="" />
          <img className="logo-img for-dark" src="/logo-dark.png" alt="" />
          <span className="ph-bell"><Icon name="heartPulse" size={16} /></span>
        </div>
        <div className="ph-card ph-status">
          <div className="ph-row"><span className="ph-dot" /><strong>{p.onTheWay}</strong></div>
          <div className="ph-eta"><Icon name="clock" size={14} /> {p.eta}</div>
          <div className="ph-steps">
            {p.steps.map((s, i) => <span key={s} className={i < 2 ? 'on' : ''}>{s}</span>)}
          </div>
        </div>
        <div className="ph-map">
          <svg viewBox="0 0 220 110" preserveAspectRatio="none">
            <path className="road" d="M0 80 C40 70 60 30 110 40 S180 90 220 60" />
            <path className="road thin" d="M30 0 C40 40 70 60 60 110" />
            <path className="route" d="M18 76 C50 66 70 34 110 42 S170 84 196 64" />
          </svg>
          <span className="pin pin-a"><Icon name="mapPin" size={18} /></span>
          <span className="pin pin-b"><Icon name="home" size={16} /></span>
        </div>
        <div className="ph-card ph-nurse">
          <span className="ph-avatar"><Icon name="userCheck" size={18} /></span>
          <div>
            <strong>{p.nurse}</strong>
            <div className="ph-stars">★★★★★ <small>4.9</small></div>
          </div>
          <span className="ph-call"><Icon name="phone" size={14} /></span>
        </div>
        <div className="ph-card ph-price">
          <span>{p.service}</span>
          <span><small>{p.total}</small> <strong>200</strong></span>
        </div>
        <div className="ph-btn">{p.track}</div>
      </div>
    </div>
  );
}
