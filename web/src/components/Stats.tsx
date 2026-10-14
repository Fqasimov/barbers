import { useEffect, useRef, useState } from 'react';

import { loadStats, type Stats as Figures } from '../api';
import type { Key } from '../i18n';
import { useI18n } from '../lang';

type StatKey = Exclude<keyof Figures, 'updated_at'>;
const ITEMS: { key: StatKey; label: Key; digits?: number; suffix?: string }[] = [
  { key: 'salons', label: 'statSalons' },
  { key: 'masters', label: 'statMasters' },
  { key: 'bookings', label: 'statBookings' },
  { key: 'clients', label: 'statClients' },
  { key: 'average_rating', label: 'statRating', digits: 1, suffix: '★' },
  { key: 'districts', label: 'statDistricts' },
];

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

/** Counts up once, when it first comes into view. */
function Figure({ value, digits = 0, suffix = '' }: { value: number; digits?: number; suffix?: string }) {
  const { num } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(() => (matchMedia('(prefers-reduced-motion: reduce)').matches ? value : 0));

  useEffect(() => {
    const el = ref.current;
    if (!el || shown === value) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1200);
        setShown(value * easeOut(p));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // Runs once per value; `shown` is the animation's own state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <dd ref={ref} aria-label={`${num(value, digits)}${suffix}`}>
      <span aria-hidden="true">
        {num(digits ? shown : Math.round(shown), digits)}
        {suffix ? <span className="stat-suffix">{suffix}</span> : null}
      </span>
    </dd>
  );
}

/**
 * Live network figures from GET /api/stats. Until they arrive each tile shows a
 * shimmering placeholder; a figure the server doesn't have yet stays a dash.
 */
export function Stats() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<Figures | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    loadStats()
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null));
    return () => {
      alive = false;
    };
  }, []);

  const updated = data?.updated_at
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.updated_at))
    : null;

  return (
    <section className="stats" id="stats" aria-labelledby="statsTitle">
      <div className="wrap">
        <div className="stats-head">
          <p className="kicker kicker-light reveal">{t('statsKicker')}</p>
          <h2 className="h2 reveal" id="statsTitle">
            {t('statsTitle')}
          </h2>
        </div>
        <dl className="stats-grid" aria-busy={data === undefined}>
          {ITEMS.map((it) => {
            const v = data?.[it.key];
            return (
              <div key={it.key} className="stat reveal">
                <dt>{t(it.label)}</dt>
                {data === undefined ? (
                  <dd className="is-loading">—</dd>
                ) : typeof v === 'number' && v > 0 ? (
                  <Figure value={v} digits={it.digits} suffix={it.suffix} />
                ) : (
                  <dd className="is-empty" aria-label={t('statsPending')}>
                    —
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
        <p className="stats-note" aria-live="polite">
          {data === null ? t('statsPending') : updated ? t('statsUpdated', { time: updated }) : ''}
        </p>
      </div>
    </section>
  );
}
