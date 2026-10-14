import 'leaflet/dist/leaflet.css';

import type { LatLngExpression, Map as LeafletMap, Marker } from 'leaflet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { loadReviews, loadVenues, type Venue, type VenueReview } from '../api';
import { asset, config } from '../config';
import { categories, type CategoryId } from '../i18n';
import { useI18n } from '../lang';
import { SectionHead } from './ui';

const BAKU: LatLngExpression = [40.395, 49.86];
/** Cover tones for venues without a photo, from the app (src/theme/tokens.ts). */
const TONES: Record<string, string> = {
  oxblood: '#4A2321',
  forest: '#24382E',
  navy: '#232B38',
  clay: '#8A5A44',
  olive: '#4B4A33',
  sand: '#B9A88E',
  slate: '#3B3E43',
  rose: '#7C5551',
  ink: '#1E1B18',
  bone: '#DDD3C3',
};
const CARD_W = 330;
/** Emil's tooltip rule: the first card waits a beat; while one was just open, the next is instant. */
const OPEN_DELAY = 140;
const WARM_MS = 500;

type Open = { venue: Venue; pinned: boolean; instant: boolean };

const coarse = () => matchMedia('(hover: none), (pointer: coarse)').matches;
const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches;

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars-sm" aria-hidden="true">
      {'★'.repeat(full)}
      {'☆'.repeat(5 - full)}
    </span>
  );
}

function Reviews({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const [list, setList] = useState<VenueReview[] | null>(null);
  useEffect(() => {
    let alive = true;
    setList(null);
    loadReviews(id)
      .then((r) => alive && setList(r))
      .catch(() => alive && setList([]));
    return () => {
      alive = false;
    };
  }, [id]);
  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(iso));

  return (
    <div className="mc-reviews">
      <h4>{t('latestReviews')}</h4>
      {list === null ? (
        <p className="mc-review muted">{t('reviewsLoading')}</p>
      ) : list.length === 0 ? (
        <p className="mc-review muted">{t('noReviews')}</p>
      ) : (
        list.slice(0, 2).map((r, i) => (
          <div className="mc-review" key={i}>
            <b>{r.author}</b>
            <Stars rating={r.rating} />
            <span className="mc-date"> · {date(r.date)}</span>
            <p>{r.text}</p>
          </div>
        ))
      )}
    </div>
  );
}

function VenueCard({ venue, pinned, onClose }: { venue: Venue; pinned: boolean; onClose: () => void }) {
  const { t, tx, num } = useI18n();
  const cover = venue.photo
    ? { backgroundImage: `linear-gradient(180deg, transparent 40%, rgba(0,0,0,.55)), url("${encodeURI(venue.photo)}")` }
    : { background: TONES[venue.tone] ?? TONES.ink };
  return (
    <>
      <div className="mc-cover" style={cover}>
        <span>{venue.categories.map((c) => tx(categories.find((x) => x.id === c)?.label)).join(' · ')}</span>
      </div>
      {pinned ? (
        <button className="mc-close" type="button" onClick={onClose} aria-label={t('close')}>
          ×
        </button>
      ) : null}
      <h3>{venue.name}</h3>
      <p className="mc-kind">{tx(venue.kind)}</p>
      <div className="mc-meta">
        <span className="mc-rating">
          <span className="star" aria-hidden="true">
            ★
          </span>
          {num(venue.rating, 1)}
        </span>
        <span className="muted">{t('reviewsN', { n: num(venue.reviewCount) })}</span>
      </div>
      <p className="mc-addr">
        <span aria-hidden="true">⌖</span>
        <span>
          {venue.district}
          {venue.address ? ` · ${venue.address}` : ''}
        </span>
      </p>
      <Reviews id={venue.id} />
    </>
  );
}

/**
 * Every live partner on a map of Baku. Hovering (or focusing) a pin shows the
 * rating, the address and the newest reviews; a click or tap pins the card.
 * Leaflet loads only when the section comes near the viewport.
 */
export function PartnersMap() {
  const { t, tx, num, lang } = useI18n();
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const timer = useRef<number>(0);
  const lastClosed = useRef(0);

  const [near, setNear] = useState(false);
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<CategoryId | 'all'>('all');
  const [open, setOpen] = useState<Open | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; side: 'left' | 'right' } | null>(null);
  const [touch] = useState(coarse);

  // Load when the section is within a screen of the viewport.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    loadVenues()
      .then(setVenues)
      .catch(() => setFailed(true));
  }, [near]);

  const visible = useMemo(
    () => (venues ?? []).filter((v) => filter === 'all' || v.categories.includes(filter)),
    [venues, filter],
  );
  const present = useMemo(() => new Set((venues ?? []).flatMap((v) => v.categories)), [venues]);

  const place = useCallback(() => {
    const m = map.current;
    const box = shell.current;
    if (!m || !box || !open) return setPos(null);
    const p = m.latLngToContainerPoint([open.venue.coords.latitude, open.venue.coords.longitude]);
    const w = box.clientWidth;
    const h = box.clientHeight;
    const cardH = card.current?.offsetHeight ?? 320;
    const side = p.x + 18 + CARD_W > w - 12 ? 'left' : 'right';
    const left = side === 'right' ? p.x + 18 : Math.max(12, p.x - 18 - CARD_W);
    const top = Math.min(Math.max(12, p.y - 40), Math.max(12, h - cardH - 12));
    setPos({ left, top, side });
  }, [open]);

  const show = useCallback((venue: Venue, pinned: boolean) => {
    window.clearTimeout(timer.current);
    const warm = Date.now() - lastClosed.current < WARM_MS;
    const go = () =>
      setOpen((cur) => ({
        venue,
        pinned: pinned || (!!cur?.pinned && cur.venue.id === venue.id),
        instant: warm || !!cur,
      }));
    if (pinned || warm) go();
    else timer.current = window.setTimeout(go, OPEN_DELAY);
  }, []);

  const hide = useCallback((force = false) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () =>
        setOpen((cur) => {
          if (!cur || (cur.pinned && !force)) return cur;
          lastClosed.current = Date.now();
          return null;
        }),
      force ? 0 : 160,
    );
  }, []);

  // Build the map once the venues are in.
  useEffect(() => {
    if (!venues || !canvas.current || map.current) return;
    let cancelled = false;
    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !canvas.current) return;
      const m = L.map(canvas.current, { center: BAKU, zoom: 12, scrollWheelZoom: false });
      if (config.tiles.light) {
        L.tileLayer(prefersDark() ? config.tiles.dark : config.tiles.light, {
          attribution: config.tiles.attribution,
          maxZoom: 19,
          subdomains: 'abcd',
          detectRetina: true,
        }).addTo(m);
      } else {
        // No tile server (an offline preview): draw the Absheron coastline from Natural Earth instead.
        canvas.current.classList.add('map-plain');
        m.attributionControl.addAttribution('Coastline: Natural Earth');
        void fetch(asset('data/baku-land.json'))
          .then((r) => r.json())
          .then((land) => {
            if (cancelled) return;
            L.geoJSON(land, { interactive: false, style: { className: 'land', weight: 1, fillOpacity: 1 } }).addTo(m);
          })
          .catch(() => undefined);
      }
      // The page scrolls past the map until someone clicks into it.
      m.on('click', () => {
        m.scrollWheelZoom.enable();
        hide(true);
      });
      m.on('mouseout', () => m.scrollWheelZoom.disable());

      for (const v of venues) {
        const icon = L.divIcon({
          className: 'pin',
          html: `<span class="pin-body"><span class="star">★</span>${v.rating.toFixed(1)}</span>`,
          iconSize: [0, 0],
        });
        const mk = L.marker([v.coords.latitude, v.coords.longitude], {
          icon,
          keyboard: true,
          title: v.name,
          riseOnHover: true,
        })
          .addTo(m)
          .on('mouseover', () => !coarse() && show(v, false))
          .on('mouseout', () => !coarse() && hide())
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            show(v, true);
          });
        mk.getElement()?.addEventListener('focus', () => show(v, false));
        mk.getElement()?.addEventListener('blur', () => hide());
        markers.current.set(v.id, mk);
      }
      if (venues.length) {
        m.fitBounds(L.latLngBounds(venues.map((v) => [v.coords.latitude, v.coords.longitude])), {
          padding: [48, 48],
          maxZoom: 14,
        });
      }
      map.current = m;
    });
    return () => {
      cancelled = true;
    };
  }, [venues, show, hide]);

  useEffect(
    () => () => {
      map.current?.remove();
      map.current = null;
    },
    [],
  );

  // Keep the card next to its pin while the map moves.
  useEffect(() => {
    const m = map.current;
    place();
    if (!m) return;
    m.on('move zoom resize', place);
    return () => {
      m.off('move zoom resize', place);
    };
  }, [place]);

  // Filtered-out pins fade back; the open pin is highlighted.
  useEffect(() => {
    const keep = new Set(visible.map((v) => v.id));
    markers.current.forEach((mk, id) => {
      const el = mk.getElement();
      el?.classList.toggle('dim', !keep.has(id));
      el?.classList.toggle('active', open?.venue.id === id);
    });
    if (open && !keep.has(open.venue.id)) setOpen(null);
  }, [visible, open]);

  useEffect(() => {
    if (!open?.pinned) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide(true);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hide]);

  const focusVenue = (v: Venue) => {
    const m = map.current;
    m?.flyTo([v.coords.latitude, v.coords.longitude], Math.max(m.getZoom(), 14), { duration: 0.6 });
    show(v, true);
    shell.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const status = failed ? t('mapError') : !venues ? t('mapLoading') : venues.length === 0 ? t('mapEmpty') : null;

  return (
    <section className="section map-section" id="map" ref={section}>
      <div className="wrap">
        <SectionHead kicker={t('mapKicker')} title={t('mapTitle')} sub={touch ? t('mapSubTouch') : t('mapSub')} />
        <div className="map-bar reveal">
          <div className="chips" role="group" aria-label={t('fCategories')}>
            <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              {t('mapAll')}
            </button>
            {categories
              .filter((c) => present.has(c.id))
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="chip"
                  aria-pressed={filter === c.id}
                  onClick={() => setFilter(c.id)}
                >
                  {tx(c.label)}
                </button>
              ))}
          </div>
          {venues?.length ? (
            <span className="map-count" aria-live="polite">
              {t('mapCount', { n: num(visible.length) })}
            </span>
          ) : null}
        </div>
        <div className="map-shell reveal" ref={shell}>
          <div className="map" ref={canvas} role="region" aria-label={t('mapTitle')} />
          {status ? <p className="map-status">{status}</p> : null}
          {open && pos ? (
            <div
              ref={card}
              key={`${open.venue.id}-${lang}`}
              className={`map-card from-${pos.side}${open.pinned ? ' pinned' : ''}${open.instant ? ' instant' : ''}`}
              style={{ left: pos.left, top: pos.top }}
              onMouseEnter={() => window.clearTimeout(timer.current)}
              onMouseLeave={() => hide()}
              role="dialog"
              aria-label={open.venue.name}
            >
              <VenueCard venue={open.venue} pinned={open.pinned} onClose={() => hide(true)} />
            </div>
          ) : null}
        </div>
        {visible.length ? (
          <details className="map-list reveal">
            <summary>
              {t('listTitle')} ({num(visible.length)})
            </summary>
            <ul>
              {[...visible]
                .sort((a, b) => b.rating - a.rating)
                .map((v) => (
                  <li key={v.id}>
                    <button type="button" className="list-item" onClick={() => focusVenue(v)}>
                      <strong>{v.name}</strong>{' '}
                      <span>
                        · {v.district} · ★ {num(v.rating, 1)}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  );
}
