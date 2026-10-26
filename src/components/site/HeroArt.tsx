import { Icon, IconName } from './Icons';

/* Floating translucent nursing symbols + animated ECG line. Pure CSS animation, decorative only. */
const FLOATERS: Array<{ name: IconName; top: string; left: string; size: number; dur: number; delay: number }> = [
  { name: 'cross', top: '12%', left: '6%', size: 64, dur: 14, delay: 0 },
  { name: 'heartPulse', top: '68%', left: '10%', size: 56, dur: 17, delay: -4 },
  { name: 'syringe', top: '22%', left: '46%', size: 44, dur: 15, delay: -2 },
  { name: 'pill', top: '80%', left: '40%', size: 42, dur: 19, delay: -8 },
  { name: 'stethoscope', top: '8%', left: '82%', size: 60, dur: 18, delay: -6 },
  { name: 'droplet', top: '55%', left: '90%', size: 40, dur: 13, delay: -3 },
  { name: 'shield', top: '40%', left: '24%', size: 38, dur: 21, delay: -10 },
  { name: 'bandage', top: '86%', left: '72%', size: 46, dur: 16, delay: -5 },
  { name: 'cross', top: '48%', left: '62%', size: 30, dur: 12, delay: -7 },
  { name: 'thermometer', top: '30%', left: '94%', size: 34, dur: 20, delay: -9 },
];

export function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="grid-dots" />
      {FLOATERS.map((f, i) => (
        <span key={i} className="floater" style={{ top: f.top, left: f.left, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}>
          <Icon name={f.name} size={f.size} strokeWidth={1.4} />
        </span>
      ))}
      <svg className="ecg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path className="ecg-base" d="M0 60 H300 L330 60 L350 20 L375 105 L400 8 L425 95 L445 60 H700 L725 60 L745 28 L768 100 L792 12 L815 90 L835 60 H1200" />
        <path className="ecg-pulse" d="M0 60 H300 L330 60 L350 20 L375 105 L400 8 L425 95 L445 60 H700 L725 60 L745 28 L768 100 L792 12 L815 90 L835 60 H1200" />
      </svg>
    </div>
  );
}
