import { plans, type Key, type Plan } from '../i18n';
import { useI18n } from '../lang';

const MARKETS: { id: Plan['market']; title: Key; sub: Key }[] = [
  { id: 'beauty', title: 'marketBeauty', sub: 'marketBeautySub' },
  { id: 'couture', title: 'marketCouture', sub: 'marketCoutureSub' },
];

/** Plans by market: salons and barbershops (the main market) first, then couture brands. */
export function Pricing() {
  const { t, tx } = useI18n();
  return (
    <section className="section pricing" id="pricing">
      <div className="wrap">
        <p className="kicker reveal">{t('pricingKicker')}</p>
        <h2 className="h2 reveal">{t('pricingTitle')}</h2>
        <p className="section-sub reveal">{t('pricingSub')}</p>
        {MARKETS.map((m) => {
          const list = plans.filter((p) => p.market === m.id);
          return (
            <div className={`market market-${m.id} reveal`} key={m.id}>
              <div className="market-head">
                <h3>{t(m.title)}</h3>
                <p>{t(m.sub)}</p>
              </div>
              <div className={`price-grid n${list.length}`}>
                {list.map((p) => (
                  <article className={`price-card${p.recommended ? ' rec' : ''}`} key={p.id}>
                    <header>
                      <h4>{p.name}</h4>
                      {p.recommended ? <span className="price-badge">{t('recommended')}</span> : null}
                    </header>
                    <p className="price-blurb">{tx(p.blurb)}</p>
                    <p className="price-amount">
                      {p.price} ₼ <small>{t('perMonthShort')}</small>
                    </p>
                    <ul>
                      {p.features.map((f) => (
                        <li key={f.en}>{tx(f)}</li>
                      ))}
                    </ul>
                    <a className="price-cta" href="#join">
                      {t('pricingCta')}
                    </a>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
