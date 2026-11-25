import { useState } from 'react';
import { plans, type Key, type Plan } from '../i18n';
import { useI18n } from '../lang';

type Market = Plan['market'];

const MARKETS: { id: Market; title: Key; sub: Key }[] = [
  { id: 'beauty', title: 'marketBeauty', sub: 'marketBeautySub' },
  { id: 'couture', title: 'marketCouture', sub: 'marketCoutureSub' },
];

/** What the sign-up form listens for: a plan picked here preselects it there. */
export type PlanPick = { plan: Plan['id']; market: Market };
export const PLAN_PICK_EVENT = 'yz:plan-pick';

/** Plans for one market at a time: salons and barbershops (the main market) first, then couture brands. */
export function Pricing() {
  const { t, tx } = useI18n();
  const [market, setMarket] = useState<Market>('beauty');
  const [picked, setPicked] = useState<Plan['id'] | null>(null);
  const m = MARKETS.find((x) => x.id === market)!;
  const list = plans.filter((p) => p.market === market);

  const pick = (p: Plan) => {
    setPicked(p.id);
    window.dispatchEvent(new CustomEvent<PlanPick>(PLAN_PICK_EVENT, { detail: { plan: p.id, market: p.market } }));
    // Let the pressed state show before the page moves.
    window.setTimeout(
      () => document.getElementById('join')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      220,
    );
  };

  return (
    <section className="section pricing" id="pricing">
      <div className="wrap">
        <p className="kicker reveal">{t('pricingKicker')}</p>
        <h2 className="h2 reveal">{t('pricingTitle')}</h2>
        <p className="section-sub reveal">{t('pricingSub')}</p>

        <div className="market-switch reveal" role="tablist" aria-label={t('pricingFor')}>
          {MARKETS.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              id={`market-tab-${x.id}`}
              aria-selected={market === x.id}
              aria-controls="market-panel"
              aria-label={t(x.title)}
              className={market === x.id ? 'on' : undefined}
              onClick={() => {
                setMarket(x.id);
                setPicked(null);
              }}
            >
              <span className="long">{t(x.title)}</span>
              <span className="short" aria-hidden="true">
                {t(x.id === 'beauty' ? 'marketBeautyShort' : 'marketCoutureShort')}
              </span>
            </button>
          ))}
        </div>

        <div
          className={`market market-${market}`}
          id="market-panel"
          role="tabpanel"
          aria-labelledby={`market-tab-${market}`}
          key={market}
        >
          <div className="market-head">
            <h3>{t(m.title)}</h3>
            <p>{t(m.sub)}</p>
          </div>
          <div className={`price-grid n${list.length}`}>
            {list.map((p) => {
              const on = picked === p.id;
              return (
                <article className={`price-card${p.recommended ? ' rec' : ''}${on ? ' picked' : ''}`} key={p.id}>
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
                  <button className="price-cta" type="button" aria-pressed={on} onClick={() => pick(p)}>
                    {on ? t('pricingPicked') : t('pricingCta')}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
