import { config } from '../config';
import type { Key } from '../i18n';
import { useI18n } from '../lang';
import { SectionHead, Stores, Wordmark } from './ui';

export function About() {
  const { t } = useI18n();
  const facts: [string, Key][] = [
    ['Az', 'aboutFact1'],
    ['0₼', 'aboutFact2'],
    ['BAK', 'aboutFact3'],
  ];
  return (
    <section className="section about" id="about">
      <div className="wrap about-grid">
        <div>
          <p className="kicker reveal">{t('aboutKicker')}</p>
          <h2 className="h2 reveal">{t('aboutTitle')}</h2>
        </div>
        <div className="about-body">
          <p className="lead reveal">{t('aboutBody1')}</p>
          <p className="reveal">{t('aboutBody2')}</p>
          <ul className="facts reveal">
            {facts.map(([icon, key]) => (
              <li key={key}>
                <span className="fact-icon" aria-hidden="true">
                  {icon}
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const WHY: [Key, Key][] = [
  ['why1Title', 'why1Body'],
  ['why2Title', 'why2Body'],
  ['why3Title', 'why3Body'],
  ['why4Title', 'why4Body'],
  ['why5Title', 'why5Body'],
  ['why6Title', 'why6Body'],
];

const COMPARE: [Key, Key, Key][] = [
  ['cmpRow1', 'cmpNo', 'cmpOften'],
  ['cmpRow2', 'cmpNo', 'cmpOften'],
  ['cmpRow3', 'cmpYes', 'cmpNotAlways'],
  ['cmpRow4', 'cmpYes', 'cmpNotAlways'],
  ['cmpRow5', 'cmpYes', 'cmpNotAlways'],
];

export function Why() {
  const { t } = useI18n();
  return (
    <section className="section why" id="why">
      <div className="wrap">
        <SectionHead kicker={t('whyKicker')} title={t('whyTitle')} sub={t('whySub')} />
        <div className="why-grid">
          {WHY.map(([title, body], i) => (
            <article key={title} className="card why-card reveal">
              <span className="why-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{t(title)}</h3>
              <p>{t(body)}</p>
            </article>
          ))}
        </div>
        <div className="card compare reveal">
          <table>
            <caption className="sr-only">{t('cmpTitle')}</caption>
            <thead>
              <tr>
                <td />
                <th scope="col" className="col-usta">
                  <Wordmark size="sm" />
                </th>
                <th scope="col">{t('cmpOthers')}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([row, usta, others]) => (
                <tr key={row}>
                  <th scope="row">{t(row)}</th>
                  <td className="col-usta good">{t(usta)}</td>
                  <td>{t(others)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const FAQ: [Key, Key][] = [
  ['faq1Q', 'faq1A'],
  ['faq2Q', 'faq2A'],
  ['faq3Q', 'faq3A'],
  ['faq4Q', 'faq4A'],
];

export function Faq() {
  const { t } = useI18n();
  return (
    <section className="section faq" id="faq">
      <div className="wrap faq-grid">
        <h2 className="h2 reveal">{t('faqTitle')}</h2>
        <div className="faq-list">
          {FAQ.map(([q, a]) => (
            <details key={q} className="reveal">
              <summary>{t(q)}</summary>
              <p>{t(a)}</p>
            </details>
          ))}
          <a className="hero-link" href="/help/">
            {t('faqMore')}
          </a>
        </div>
      </div>
    </section>
  );
}

export function Download() {
  const { t } = useI18n();
  return (
    <section className="get">
      <div className="wrap">
        <div className="get-inner reveal">
          <div>
            <h2 className="h2">{t('getTitle')}</h2>
            <p className="section-sub">{t('getSub')}</p>
          </div>
          <Stores />
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  const { company } = config;
  const legal = [company.name, company.voen ? `${t('footVoen')}: ${company.voen}` : '', company.address]
    .filter(Boolean)
    .join(' · ');
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div>
          <Wordmark size="lg" />
          {legal ? <p className="muted foot-company">{legal}</p> : null}
        </div>
        <nav className="foot-links" aria-label="Footer">
          <a href="/privacy/">{t('footPrivacy')}</a>
          <a href="/terms/">{t('footTerms')}</a>
          <a href="/help/">{t('footHelp')}</a>
          <a href={`mailto:${config.supportEmail}`}>{t('footContact')}</a>
        </nav>
        <p className="muted foot-rights">{t('footRights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
