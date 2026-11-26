import { asset, config, page } from '../config';
import type { Key } from '../i18n';
import { useI18n } from '../lang';
import { href } from '../route';
import { Lockup, Stores } from './ui';

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

/**
 * Who we are and why we're different, as one section: the story and three facts up top,
 * then the six reasons as cards, then the comparison with other booking services.
 */
export function About() {
  const { t } = useI18n();
  const facts: Key[] = ['aboutFact1', 'aboutFact2', 'aboutFact3'];
  return (
    <section className="section about" id="about" aria-labelledby="aboutTitle">
      <span id="why" className="anchor" aria-hidden="true" />
      <div className="wrap">
        <div className="about-top">
          <div>
            <p className="kicker reveal">{t('aboutKicker')}</p>
            <h2 className="h2 reveal" id="aboutTitle">
              {t('aboutTitle')}
            </h2>
          </div>
          <div className="about-body">
            <p className="lead reveal">{t('aboutBody1')}</p>
            <p className="reveal">{t('aboutBody2')}</p>
          </div>
        </div>

        <ul className="facts reveal">
          {facts.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>

        <div className="why-head reveal">
          <p className="kicker">{t('whyKicker')}</p>
          <h3>{t('whyTitle')}</h3>
          <p>{t('whySub')}</p>
        </div>
        <div className="why-grid">
          {WHY.map(([title, body], i) => (
            <article key={title} className="why-item reveal">
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <h4>{t(title)}</h4>
              <p>{t(body)}</p>
            </article>
          ))}
        </div>
        <div className="compare reveal">
          <table>
            <caption className="sr-only">{t('cmpTitle')}</caption>
            <thead>
              <tr>
                <td />
                <th scope="col" className="col-us">
                  <Lockup size="sm" />
                </th>
                <th scope="col">{t('cmpOthers')}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([row, ours, others]) => (
                <tr key={row}>
                  <th scope="row">{t(row)}</th>
                  <td className="col-us good">{t(ours)}</td>
                  <td>{t(others)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="section-more reveal">
          <a className="link-arrow" href={href.pricing()}>
            {t('seePlans')}
          </a>
        </p>
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
              {q === 'faq2Q' ? (
                <a className="link-arrow" href={href.pricing()}>
                  {t('seePlans')}
                </a>
              ) : null}
            </details>
          ))}
          <a className="link-arrow" href={page('help')}>
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
    <section className="get" id="get" aria-labelledby="getTitle">
      <div className="wrap get-inner">
        <img className="get-mark reveal" src={asset('tools/mark.webp')} alt="" width={720} height={720} />
        <div className="reveal">
          <h2 className="h2" id="getTitle">
            {t('getTitle')}
          </h2>
          <p className="section-sub">{t('getSub')}</p>
        </div>
        <div className="reveal">
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
          <a href={href.home()} aria-label="yazılnow" className="foot-home">
            <Lockup size="lg" tone="light" />
          </a>
          {legal ? <p className="foot-company">{legal}</p> : null}
        </div>
        <nav className="foot-links" aria-label="Footer">
          <a href={href.pricing()}>{t('footPricing')}</a>
          <a href={page('privacy')}>{t('footPrivacy')}</a>
          <a href={page('terms')}>{t('footTerms')}</a>
          <a href={page('help')}>{t('footHelp')}</a>
          <a href={`mailto:${config.supportEmail}`}>{t('footContact')}</a>
        </nav>
        <p className="foot-rights">{t('footRights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
