import Link from 'next/link';
import { db } from '@/lib/db';
import { getLang } from '@/lib/lang';
import { DICT } from '@/lib/shared/i18n';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { HeroArt } from '@/components/site/HeroArt';
import { PhoneMockup } from '@/components/site/PhoneMockup';
import { NurseIllustration } from '@/components/site/NurseIllustration';
import { Icon, IconName, serviceIcon } from '@/components/site/Icons';
import { Counter, RevealObserver } from '@/components/site/Motion';

export const dynamic = 'force-dynamic';

interface Service { id: string; name_ar: string; name_en: string; description_ar: string; description_en: string; price: string; image_url: string | null }

async function loadHome() {
  const empty = { services: [] as Service[], whatsapp: '201062569857', counts: { services: 0, governorates: 1, nurses: 0, completed: 0 } };
  try {
    const head = { count: 'exact' as const, head: true };
    const [svc, wa, govs, nurses, paid] = await Promise.all([
      db().from('services').select('id, name_ar, name_en, description_ar, description_en, price, image_url').eq('is_active', true).is('deleted_at', null).order('sort_order').limit(12),
      db().from('settings').select('value').eq('key', 'SUPPORT_WHATSAPP').maybeSingle(),
      db().from('cities').select('id, governorates!inner(is_active)', head).eq('is_active', true).eq('governorates.is_active', true),
      db().from('nurse_profiles').select('user_id', head).eq('verification_status', 'APPROVED'),
      db().from('bookings').select('id', head).eq('status', 'PAID'),
    ]);
    const services = (svc.data ?? []) as Service[];
    return {
      services,
      whatsapp: (wa.data?.value as string) || empty.whatsapp,
      counts: { services: services.length, governorates: govs.count ?? 1, nurses: nurses.count ?? 0, completed: paid.count ?? 0 },
    };
  } catch {
    return empty;
  }
}

export default async function Home() {
  const lang = await getLang();
  const t = DICT[lang];
  const { services, whatsapp, counts } = await loadHome();
  const apk = process.env.NEXT_PUBLIC_ANDROID_APK_URL;
  const name = (s: Service) => (lang === 'en' && s.name_en ? s.name_en : s.name_ar);
  const desc = (s: Service) => (lang === 'en' && s.description_en ? s.description_en : s.description_ar);
  const fmt = (n: number) => n.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');

  const stats: Array<{ icon: IconName; to: number; suffix?: string; label: string }> = [
    { icon: 'stethoscope', to: counts.services, label: t.stats.services },
    { icon: 'mapPin', to: counts.governorates, suffix: counts.governorates > 1 ? '+' : '', label: t.stats.governorates },
    counts.nurses >= 10 ? { icon: 'userCheck', to: counts.nurses, suffix: '+', label: t.stats.nurses } : { icon: 'clock', to: 24, suffix: '/7', label: t.stats.support },
    counts.completed >= 10 ? { icon: 'heartPulse', to: counts.completed, suffix: '+', label: t.stats.completed } : { icon: 'shield', to: 100, suffix: '%', label: t.stats.verified },
  ];
  const whyIcons: IconName[] = ['shield', 'mapPin', 'card'];
  const aboutIcons: IconName[] = ['home', 'users', 'shield'];
  const howIcons: IconName[] = ['stethoscope', 'mapPin', 'activity', 'card'];

  return (
    <div className="site">
      <SiteHeader t={t} lang={lang} whatsapp={whatsapp} />

      {/* ---------------- HERO ---------------- */}
      <section id="hero" className="hero">
        <HeroArt />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-badge"><span className="pulse-dot" /> {t.hero.badge}</span>
            <h1>{t.hero.title1}<br /><span className="grad-text">{t.hero.title2}</span></h1>
            <p className="hero-sub">{t.hero.subtitle}</p>
            <div className="hero-ctas">
              <Link href="/app/book" className="btn-hero primary"><Icon name="stethoscope" size={20} /> {t.hero.cta}</Link>
              <Link href="/urgent" className="btn-hero urgent"><Icon name="siren" size={20} /> {t.hero.urgent}</Link>
            </div>
            <ul className="hero-trust">
              {t.hero.trust.map((x, i) => (
                <li key={x}><Icon name={(['shield', 'card', 'activity'] as IconName[])[i]} size={18} /> {x}</li>
              ))}
            </ul>
          </div>
          <div className="hero-visual">
            <div className="halo" />
            <PhoneMockup t={t} />
            <div className="float-card fc1"><span className="fc-ic ok"><Icon name="check" size={16} /></span>{t.hero.float.accepted}</div>
            <div className="float-card fc2"><span className="fc-ic star"><Icon name="star" size={16} /></span>{t.hero.float.rating}</div>
            <div className="float-card fc3"><span className="fc-ic brand"><Icon name="card" size={16} /></span>{t.hero.float.paid}</div>
          </div>
        </div>
        <svg className="hero-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 64 C240 120 480 0 720 40 C960 80 1200 120 1440 56 V120 H0 Z" />
        </svg>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="stats-band">
        <div className="container stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-card reveal">
              <span className="stat-ic"><Icon name={s.icon} size={24} /></span>
              <div><div className="stat-n"><Counter to={s.to} suffix={s.suffix} /></div><div className="stat-l">{s.label}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- WHY ---------------- */}
      <section className="section">
        <div className="container why-grid">
          <div className="why-lead reveal">
            <span className="kicker">{t.why.kicker}</span>
            <h2>{t.why.title}</h2>
            <p>{t.why.lead}</p>
            <Link href="/app/book" className="btn-hero primary sm">{t.nav.book} <Icon name="arrow" size={18} className="flip-rtl" /></Link>
          </div>
          {t.why.cards.map((c, i) => (
            <div key={c.t} className="feature-card reveal" style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="feature-ic"><Icon name={whyIcons[i]} size={26} /></span>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- ABOUT ---------------- */}
      <section id="about" className="section alt">
        <div className="container about-grid">
          <div className="about-visual reveal"><NurseIllustration /></div>
          <div className="about-copy reveal">
            <span className="kicker">{t.about.kicker}</span>
            <h2>{t.about.title}</h2>
            <p>{t.about.text}</p>
            <ul className="about-points">
              {t.about.points.map((p, i) => (
                <li key={p.t}>
                  <span className="feature-ic sm"><Icon name={aboutIcons[i]} size={22} /></span>
                  <div><h4>{p.t}</h4><p>{p.d}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- SERVICES ---------------- */}
      <section id="services" className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="kicker">{t.services.kicker}</span>
            <h2>{t.services.title}</h2>
            <p>{t.services.lead}</p>
          </div>
          {services.length === 0 && <p className="center muted">{t.services.empty}</p>}
          <div className="services-grid">
            {services.map((s, i) => (
              <Link key={s.id} href={`/app/book?service=${s.id}`} className="service-card reveal" style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
                {s.image_url
                  ? <div className="service-img" style={{ backgroundImage: `url(${s.image_url})` }} />
                  : <div className="service-icon"><Icon name={serviceIcon(`${s.name_ar} ${s.name_en}`)} size={34} strokeWidth={1.8} /></div>}
                <h3>{name(s)}</h3>
                <p>{desc(s)}</p>
                <div className="service-foot">
                  <span className="price"><small>{t.services.from}</small> {fmt(Number(s.price))} <small>{t.services.currency}</small></span>
                  <span className="go">{t.services.order} <Icon name="arrow" size={16} className="flip-rtl" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- HOW ---------------- */}
      <section id="how" className="section alt">
        <div className="container">
          <div className="section-head reveal">
            <span className="kicker">{t.how.kicker}</span>
            <h2>{t.how.title}</h2>
          </div>
          <div className="steps-grid">
            {t.how.steps.map((s, i) => (
              <div key={s.t} className="step-card reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <span className="step-num">{fmt(i + 1)}</span>
                <span className="feature-ic"><Icon name={howIcons[i]} size={26} /></span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- EMERGENCY ---------------- */}
      <section className="section tight">
        <div className="container">
          <div className="emergency reveal">
            <div className="emergency-ic"><Icon name="siren" size={34} /></div>
            <div className="emergency-copy"><h2>{t.emergency.title}</h2><p>{t.emergency.text}</p></div>
            <div className="emergency-ctas">
              <Link href="/urgent" className="btn-hero light">{t.emergency.cta}</Link>
              <a href="tel:123" className="btn-hero outline"><Icon name="phone" size={18} /> {t.emergency.call}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- JOIN ---------------- */}
      <section id="join" className="section">
        <div className="container join-grid">
          <div className="join-copy reveal">
            <span className="kicker">{t.join.kicker}</span>
            <h2>{t.join.title}</h2>
            <ul className="check-list">
              {t.join.points.map((p) => <li key={p}><span className="check-ic"><Icon name="check" size={16} strokeWidth={3} /></span>{p}</li>)}
            </ul>
            <Link href="/app/register?type=nurse" className="btn-hero primary">{t.join.cta} <Icon name="arrow" size={18} className="flip-rtl" /></Link>
          </div>
          <div className="join-visual reveal">
            <div className="join-card jc1"><Icon name="wallet" size={22} /><div><small>{lang === 'ar' ? 'رصيد المحفظة' : 'Wallet balance'}</small><strong>{fmt(2850)} {t.services.currency}</strong></div></div>
            <div className="join-card jc2"><Icon name="heartPulse" size={22} /><div><small>{lang === 'ar' ? 'طلب جديد • 2.4 كم' : 'New request • 2.4 km'}</small><strong>{lang === 'ar' ? 'ربحك' : 'You earn'} {fmt(180)} {t.services.currency}</strong></div></div>
            <div className="join-card jc3"><Icon name="star" size={22} /><div><small>{lang === 'ar' ? 'تقييمك' : 'Your rating'}</small><strong>4.9 ★</strong></div></div>
            <div className="join-orb"><Icon name="stethoscope" size={90} strokeWidth={1.2} /></div>
          </div>
        </div>
      </section>

      {/* ---------------- APP ---------------- */}
      <section className="section app-band">
        <div className="container app-grid">
          <div className="app-copy reveal">
            <span className="kicker light">{t.app.kicker}</span>
            <h2>{t.app.title}</h2>
            <p>{t.app.text}</p>
            <div className="hero-ctas">
              {apk && <a href={apk} className="btn-hero light"><Icon name="download" size={20} /> {t.app.apk}</a>}
              <Link href="/app" className="btn-hero outline">{t.app.web}</Link>
            </div>
          </div>
          <div className="app-visual reveal"><PhoneMockup t={t} compact /></div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="section">
        <div className="container faq-wrap">
          <div className="section-head reveal">
            <span className="kicker">{t.faq.kicker}</span>
            <h2>{t.faq.title}</h2>
          </div>
          <div className="faq-list">
            {t.faq.items.map((f, i) => (
              <details key={f.q} className="faq-item reveal" open={i === 0}>
                <summary>{f.q}<span className="faq-plus" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CONTACT ---------------- */}
      <section id="contact" className="section alt">
        <div className="container">
          <div className="section-head reveal">
            <span className="kicker">{t.contact.kicker}</span>
            <h2>{t.contact.title}</h2>
          </div>
          <div className="contact-grid">
            <a className="contact-card reveal" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
              <span className="feature-ic wa"><Icon name="chat" size={26} /></span>
              <h3>{t.contact.whatsapp}</h3><p className="ltr">+{whatsapp}</p><small>{t.contact.whatsappD}</small>
            </a>
            <div className="contact-card reveal">
              <span className="feature-ic"><Icon name="mapPin" size={26} /></span>
              <h3>{t.contact.area}</h3><p>{t.contact.areaD}</p>
            </div>
            <div className="contact-card reveal">
              <span className="feature-ic"><Icon name="clock" size={26} /></span>
              <h3>{t.contact.hours}</h3><p>{t.contact.hoursD}</p>
            </div>
          </div>
          <div className="center" style={{ marginTop: '1.5rem' }}>
            <a className="btn-hero wa" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"><Icon name="chat" size={20} /> {t.contact.cta}</a>
          </div>
        </div>
      </section>

      <SiteFooter t={t} whatsapp={whatsapp} services={services.map((s) => ({ id: s.id, name: name(s) }))} />
      <a className="wa-fab" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="chat" size={26} /></a>
      <RevealObserver />
    </div>
  );
}
