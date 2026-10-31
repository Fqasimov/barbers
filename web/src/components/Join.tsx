import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';

import { ApiError, errorKey, loadPlanPrices, request } from '../api';
import { config, isLive, page } from '../config';
import { categories, plans, type CategoryId, type Key, type Plan } from '../i18n';
import { useI18n } from '../lang';
import { Stores } from './ui';

// ---------------------------------------------------------------------------
// The same rules as the app (src/auth/validation.ts) and the API.
// ---------------------------------------------------------------------------
const NAME = /^\p{L}[\p{L}\p{M}' -]{0,39}$/u;
const AZ_PREFIX = ['10', '50', '51', '55', '60', '70', '77', '99'];
const digits = (v: string) => v.replace(/\D/g, '').replace(/^994/, '').replace(/^0/, '').slice(0, 9);
const formatPhone = (v: string) => {
  const d = digits(v);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
};
const checks = {
  name: (v: string): Key | null =>
    !v.trim() ? 'errRequired' : NAME.test(v.trim()) && v.trim().length >= 2 ? null : 'errName',
  phone: (v: string): Key | null => {
    const d = digits(v);
    if (!d) return 'errRequired';
    return d.length === 9 && AZ_PREFIX.includes(d.slice(0, 2)) ? null : 'errPhone';
  },
  email: (v: string): Key | null =>
    !v.trim() ? 'errRequired' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && v.length <= 254 ? null : 'errEmail',
  password: (v: string): Key | null => {
    if (!v) return 'errRequired';
    if (v.length < 8 || v.length > 64) return 'errPasswordLength';
    return /\p{L}/u.test(v) && /\d/.test(v) ? null : 'errPasswordMix';
  },
  text: (v: string): Key | null => (!v.trim() ? 'errRequired' : v.trim().length < 2 ? 'errShort' : null),
};

type Owner = { first_name: string; last_name: string; phone: string; email: string; password: string };
type Salon = {
  salon_name: string;
  categories: CategoryId[];
  audience: 'all' | 'women' | 'men';
  district: string;
  address: string;
};
type Errors = Partial<Record<keyof Owner | keyof Salon | 'code', string>>;
type Challenge = { email: string; resend_at?: string; demo_code?: string };
type PlanId = Plan['id'];

const OWNER_FIELDS: (keyof Owner)[] = ['first_name', 'last_name', 'phone', 'email', 'password'];
const STEPS: Key[] = ['stepOwner', 'stepSalon', 'stepCode', 'stepPlan'];
const EMPTY_OWNER: Owner = { first_name: '', last_name: '', phone: '', email: '', password: '' };
const EMPTY_SALON: Salon = { salon_name: '', categories: [], audience: 'all', district: '', address: '' };
const DISTRICTS = [
  'Binəqədi',
  'Xətai',
  'Xəzər',
  'Qaradağ',
  'Nərimanov',
  'Nəsimi',
  'Nizami',
  'Pirallahı',
  'Sabunçu',
  'Səbail',
  'Suraxanı',
  'Yasamal',
  'İçərişəhər',
];
const demoChallenge = (email: string): Challenge => ({
  email,
  resend_at: new Date(Date.now() + 60_000).toISOString(),
  demo_code: String(Math.floor(100000 + Math.random() * 900000)),
});

const checkOwner = (o: Owner, k: keyof Owner): Key | null =>
  k === 'first_name' || k === 'last_name' ? checks.name(o[k]) : checks[k](o[k]);

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field${error ? ' invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? (
        <small className="hint" id={`${id}-hint`}>
          {hint}
        </small>
      ) : null}
      {error ? (
        <small className="err" id={`${id}-err`} role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}

/** Six boxes that behave like one field: type, paste or let the phone autofill the code. */
function CodeInput({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid: boolean }) {
  const { t } = useI18n();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => refs.current[0]?.focus(), []);
  const set = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '');
    if (d.length > 1) {
      const next = (value.slice(0, i) + d).slice(0, 6);
      onChange(next);
      refs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    const chars = value.padEnd(6, ' ').split('');
    chars[i] = d || ' ';
    onChange(chars.join('').replace(/ /g, ''));
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <fieldset className={`otp${invalid ? ' invalid' : ''}`}>
      <legend className="sr-only">{t('codeLabel')}</legend>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ''}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`${t('codeLabel')} ${i + 1}`}
          maxLength={i === 0 ? 6 : 1}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
          }}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </fieldset>
  );
}

/** "[text](link)" in a translation becomes a link. */
function withLinks(s: string) {
  return s.split(/(\[[^\]]+\]\([^)]+\))/).map((part, i) => {
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    return m ? (
      <a key={i} href={m[2].startsWith('/') ? page(m[2].replace(/\//g, '')) : m[2]} target="_blank" rel="noopener">
        {m[1]}
      </a>
    ) : (
      part
    );
  });
}

/**
 * Business sign-up, the same four steps as the app: the owner, the salon, the
 * emailed code, then a plan for the 30-day trial. Live it calls the API
 * (POST /business/register, /auth/email/verify, /business/subscription/trial);
 * without an API it runs as a demo and sends nothing.
 */
export function Join() {
  const { t, tx, num } = useI18n();
  const [step, setStep] = useState(1);
  const [owner, setOwner] = useState<Owner>(EMPTY_OWNER);
  const [salon, setSalon] = useState<Salon>(EMPTY_SALON);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<Key | null>(null);
  const [notice, setNotice] = useState<Key | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanId>('pro');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  const card = useRef<HTMLDivElement>(null);
  const lastTried = useRef('');

  useEffect(() => {
    void loadPlanPrices().then(setPrices);
  }, []);

  // The resend countdown.
  const resendAt = challenge?.resend_at ? new Date(challenge.resend_at).getTime() : 0;
  useEffect(() => {
    if (step !== 3 || resendAt <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [step, resendAt]);
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const go = (n: number) => {
    setStep(n);
    setFormError(null);
    setNotice(null);
    // Keep the form in view on phones, where each step changes its height, and move focus into it.
    requestAnimationFrame(() => {
      const el = card.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el?.querySelector<HTMLElement>('[data-step-focus]')?.focus();
    });
  };

  const setO = (k: keyof Owner) => (e: ChangeEvent<HTMLInputElement>) => {
    const v = k === 'phone' ? formatPhone(e.target.value) : e.target.value;
    setOwner((o) => ({ ...o, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const setS = (k: 'salon_name' | 'district' | 'address') => (e: ChangeEvent<HTMLInputElement>) => {
    setSalon((s) => ({ ...s, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };
  // Validate a field when the person leaves it, not while they type.
  const blurO = (k: keyof Owner) => () => {
    if (!owner[k]) return;
    const key = checkOwner(owner, k);
    setErrors((x) => ({ ...x, [k]: key ? t(key) : undefined }));
  };

  // Field messages from the server are in English; show ours where we have one.
  const serverErrors = (e: ApiError): Errors => {
    const out: Errors = {};
    for (const k of Object.keys(e.fields)) {
      const own = (OWNER_FIELDS as string[]).includes(k) ? checkOwner(owner, k as keyof Owner) : null;
      out[k as keyof Errors] = own ? t(own) : e.fields[k];
    }
    return out;
  };

  const submitOwner = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    for (const k of OWNER_FIELDS) {
      const key = checkOwner(owner, k);
      if (key) next[k] = t(key);
    }
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      card.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    go(2);
  };

  const submitSalon = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    for (const k of ['salon_name', 'district', 'address'] as const) {
      const key = checks.text(salon[k]);
      if (key) next[k] = t(key);
    }
    if (!salon.categories.length) next.categories = t('errCategories');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setFormError(null);
    try {
      const body = { ...owner, phone: `+994${digits(owner.phone)}`, email: owner.email.trim(), ...salon };
      const ch = isLive ? await request<Challenge>('POST', '/business/register', { body }) : demoChallenge(body.email);
      setChallenge(ch);
      setCode('');
      lastTried.current = '';
      go(3);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'email_taken') {
        setErrors({ email: t('errEmailTaken') });
        go(1);
      } else if (err instanceof ApiError && err.code === 'validation') {
        const fx = serverErrors(err);
        setErrors(fx);
        if (Object.keys(fx).some((k) => (OWNER_FIELDS as string[]).includes(k))) go(1);
      } else setFormError(errorKey(err));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6) return setErrors({ code: t('errCode') });
    setBusy(true);
    setFormError(null);
    try {
      if (isLive) {
        const session = await request<{ token: string }>('POST', '/auth/email/verify', {
          body: { email: challenge!.email, code },
        });
        setToken(session.token);
      } else if (code !== challenge?.demo_code) throw new ApiError('otp_invalid');
      go(4);
    } catch (err) {
      setErrors({ code: t(errorKey(err)) });
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  // Submit as soon as the sixth digit lands (once per distinct code).
  useEffect(() => {
    if (step === 3 && code.length === 6 && code !== lastTried.current && !busy) {
      lastTried.current = code;
      void submitCode();
    }
    // submitCode reads the latest state; re-running on its identity would resubmit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step]);

  const resend = async () => {
    if (!challenge || wait > 0) return;
    setFormError(null);
    try {
      const ch = isLive
        ? await request<Challenge>('POST', '/auth/otp/resend', {
            body: { email: challenge.email, purpose: 'register' },
          })
        : demoChallenge(challenge.email);
      setChallenge(ch);
      setNow(Date.now());
      setNotice('resent');
    } catch (err) {
      setFormError(errorKey(err));
    }
  };

  const submitPlan = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (isLive && token) {
        await request('POST', '/business/subscription/trial', { token, body: { plan } });
        // The site keeps no session: the owner continues in the app, so the web token is revoked.
        void request('POST', '/auth/logout', { token }).catch(() => undefined);
        setToken(null);
      }
      go(5);
    } catch (err) {
      setFormError(errorKey(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setOwner(EMPTY_OWNER);
    setSalon(EMPTY_SALON);
    setChallenge(null);
    setCode('');
    setErrors({});
    go(1);
  };

  const described = (id: string, err?: string, hint?: boolean) =>
    [hint ? `${id}-hint` : '', err ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;
  const priceOf = (id: PlanId) => prices[id] ?? plans.find((p) => p.id === id)!.price;
  const formErr = formError ? (
    <p className="form-error" role="alert">
      {t(formError)}
    </p>
  ) : null;
  const ownerInput = (k: keyof Owner, extra: Record<string, unknown> = {}) => ({
    id: k,
    name: k,
    value: owner[k],
    onChange: setO(k),
    onBlur: blurO(k),
    'aria-invalid': !!errors[k],
    'aria-describedby': described(k, errors[k], k === 'password'),
    ...extra,
  });

  return (
    <section className="section join" id="join">
      <div className="wrap join-grid">
        <div className="join-copy">
          <p className="kicker reveal">{t('joinKicker')}</p>
          <h2 className="h2 reveal">{t('joinTitle')}</h2>
          <p className="section-sub reveal">{t('joinSub')}</p>
          <p className="reveal panel-link">
            {t('joinPanel')}{' '}
            <a
              className="btn btn-sm btn-outline"
              href={config.panelUrl}
              target={/^https?:/.test(config.panelUrl ?? '') ? '_blank' : undefined}
              rel="noopener"
            >
              {t('joinPanelCta')}
            </a>
          </p>
          <ul className="ticks reveal">
            {(['joinPoint1', 'joinPoint2', 'joinPoint3', 'joinPoint4'] as const).map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
          <div className="how reveal">
            <h3>{t('joinSteps')}</h3>
            <ol>
              {(['joinStep1', 'joinStep2', 'joinStep3'] as const).map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="card form-card reveal" id="register" ref={card}>
          {step <= 4 ? (
            <>
              <ol className="progress" aria-hidden="true">
                {STEPS.map((k, i) => (
                  <li key={k} className={i + 1 === step ? 'on' : i + 1 < step ? 'done' : ''}>
                    {t(k)}
                  </li>
                ))}
              </ol>
              <p className="step-of" aria-live="polite">
                {t('stepOf', { n: step })} · {t(STEPS[step - 1])}
              </p>
            </>
          ) : null}

          {step === 1 ? (
            <form className="step" onSubmit={submitOwner} noValidate key="s1">
              <div className="pair">
                <Field id="first_name" label={t('fFirst')} error={errors.first_name}>
                  <input
                    {...ownerInput('first_name', {
                      autoComplete: 'given-name',
                      maxLength: 40,
                      'data-step-focus': true,
                    })}
                  />
                </Field>
                <Field id="last_name" label={t('fLast')} error={errors.last_name}>
                  <input {...ownerInput('last_name', { autoComplete: 'family-name', maxLength: 40 })} />
                </Field>
              </div>
              <Field id="phone" label={t('fPhone')} error={errors.phone}>
                <div className="prefix">
                  <span aria-hidden="true">+994</span>
                  <input
                    {...ownerInput('phone', {
                      type: 'tel',
                      inputMode: 'tel',
                      autoComplete: 'tel-national',
                      placeholder: '50 123 45 67',
                      maxLength: 12,
                    })}
                  />
                </div>
              </Field>
              <Field id="email" label={t('fEmail')} error={errors.email}>
                <input {...ownerInput('email', { type: 'email', autoComplete: 'email', maxLength: 254 })} />
              </Field>
              <Field id="password" label={t('fPassword')} error={errors.password} hint={t('fPasswordHint')}>
                <div className="pw">
                  <input
                    {...ownerInput('password', {
                      type: showPw ? 'text' : 'password',
                      autoComplete: 'new-password',
                      maxLength: 64,
                    })}
                  />
                  <button
                    type="button"
                    className="pw-eye"
                    aria-pressed={showPw}
                    aria-label={t('showPassword')}
                    onClick={() => setShowPw((s) => !s)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                      {showPw ? null : <path d="M3 3l18 18" />}
                    </svg>
                  </button>
                </div>
              </Field>
              {formErr}
              <button className="btn btn-ink btn-block" type="submit">
                {t('next')}
              </button>
            </form>
          ) : null}

          {step === 2 ? (
            <form className="step" onSubmit={submitSalon} noValidate key="s2">
              <Field id="salon_name" label={t('fSalonName')} error={errors.salon_name}>
                <input
                  id="salon_name"
                  name="salon_name"
                  maxLength={120}
                  placeholder={t('fSalonNamePh')}
                  value={salon.salon_name}
                  onChange={setS('salon_name')}
                  aria-invalid={!!errors.salon_name}
                  data-step-focus
                />
              </Field>
              <fieldset className={`field${errors.categories ? ' invalid' : ''}`}>
                <legend>{t('fCategories')}</legend>
                <small className="hint">{t('fCategoriesHint')}</small>
                <div className="chips chips-wrap">
                  {categories.map((c) => {
                    const on = salon.categories.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className="chip"
                        aria-pressed={on}
                        onClick={() => {
                          setSalon((s) => ({
                            ...s,
                            categories: on ? s.categories.filter((x) => x !== c.id) : [...s.categories, c.id],
                          }));
                          setErrors((x) => ({ ...x, categories: undefined }));
                        }}
                      >
                        {tx(c.label)}
                      </button>
                    );
                  })}
                </div>
                {errors.categories ? (
                  <small className="err" role="alert">
                    {errors.categories}
                  </small>
                ) : null}
              </fieldset>
              <fieldset className="field">
                <legend>{t('fAudience')}</legend>
                <div className="segmented">
                  {(
                    [
                      ['all', 'audAll'],
                      ['women', 'audWomen'],
                      ['men', 'audMen'],
                    ] as const
                  ).map(([v, k]) => (
                    <label key={v}>
                      <input
                        type="radio"
                        name="audience"
                        value={v}
                        checked={salon.audience === v}
                        onChange={() => setSalon((s) => ({ ...s, audience: v }))}
                      />
                      <span>{t(k)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field id="district" label={t('fDistrict')} error={errors.district}>
                <input
                  id="district"
                  name="district"
                  maxLength={120}
                  placeholder={t('fDistrictPh')}
                  list="districts"
                  value={salon.district}
                  onChange={setS('district')}
                  aria-invalid={!!errors.district}
                />
              </Field>
              <datalist id="districts">
                {DISTRICTS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              <Field id="address" label={t('fAddress')} error={errors.address}>
                <input
                  id="address"
                  name="address"
                  maxLength={255}
                  placeholder={t('fAddressPh')}
                  autoComplete="street-address"
                  value={salon.address}
                  onChange={setS('address')}
                  aria-invalid={!!errors.address}
                />
              </Field>
              <p className="consent">{withLinks(t('consent'))}</p>
              {formErr}
              <div className="row">
                <button className="btn btn-ghost" type="button" onClick={() => go(1)}>
                  {t('back')}
                </button>
                <button className={`btn btn-ink grow${busy ? ' loading' : ''}`} type="submit" disabled={busy}>
                  {t('sendCode')}
                </button>
              </div>
            </form>
          ) : null}

          {step === 3 && challenge ? (
            <form className="step" onSubmit={submitCode} noValidate key="s3">
              <h3 className="step-title" tabIndex={-1} data-step-focus>
                {t('codeTitle')}
              </h3>
              <p className="muted">{t('codeSub', { email: challenge.email })}</p>
              {challenge.demo_code ? <p className="demo-code">{t('codeDemo', { code: challenge.demo_code })}</p> : null}
              <CodeInput
                value={code}
                invalid={!!errors.code}
                onChange={(v) => {
                  setCode(v);
                  if (errors.code) setErrors({});
                }}
              />
              {errors.code ? (
                <p className="form-error" role="alert">
                  {errors.code}
                </p>
              ) : null}
              {formErr}
              {notice ? (
                <p className="notice" role="status">
                  {t(notice)}
                </p>
              ) : null}
              <div className="row row-between">
                <button className="link" type="button" onClick={() => go(1)}>
                  {t('changeEmail')}
                </button>
                <button className="link" type="button" onClick={resend} disabled={wait > 0}>
                  {wait > 0 ? t('resendIn', { s: wait }) : t('resend')}
                </button>
              </div>
              <button className={`btn btn-ink btn-block${busy ? ' loading' : ''}`} type="submit" disabled={busy}>
                {t('verify')}
              </button>
            </form>
          ) : null}

          {step === 4 ? (
            <form className="step" onSubmit={submitPlan} noValidate key="s4">
              <h3 className="step-title" tabIndex={-1} data-step-focus>
                {t('planTitle')}
              </h3>
              <p className="muted">{t('planSub')}</p>
              <div className="plans" role="radiogroup" aria-label={t('planTitle')}>
                {plans.map((p) => (
                  <label className="plan" key={p.id}>
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={plan === p.id}
                      onChange={() => setPlan(p.id)}
                    />
                    <span className="plan-body">
                      <span className="plan-head">
                        <span className="plan-name">
                          {p.name}
                          {p.recommended ? <span className="plan-badge">{t('recommended')}</span> : null}
                        </span>
                        <span className="plan-price">
                          {num(priceOf(p.id))} ₼<small>{t('perMonth')}</small>
                          <small className="plan-after">{t('afterTrial')}</small>
                        </span>
                      </span>
                      <span className="plan-blurb">{tx(p.blurb)}</span>
                      <span className="plan-trial">{t('trialBadge')}</span>
                      <ul>
                        {p.features.map((f) => (
                          <li key={f.en} className={f.soon ? 'soon' : undefined}>
                            {tx(f)}
                            {f.soon ? <em> · {t('soon')}</em> : null}
                          </li>
                        ))}
                      </ul>
                    </span>
                  </label>
                ))}
              </div>
              <p className="plan-note plan-note-left">{t('yearDeal')}</p>
              {formErr}
              <button className={`btn btn-ink btn-block${busy ? ' loading' : ''}`} type="submit" disabled={busy}>
                {t('startTrial')}
              </button>
              <p className="plan-note">{t('trialNote')}</p>
              <p className="plan-note">{t('trialTerms')}</p>
            </form>
          ) : null}

          {step === 5 ? (
            <div className="step done" key="s5">
              <div className="done-mark" aria-hidden="true">
                ✓
              </div>
              <h3 className="step-title" tabIndex={-1} data-step-focus>
                {t('doneTitle', { name: owner.first_name.trim() })}
              </h3>
              <p>{t('doneBody', { salon: salon.salon_name.trim() })}</p>
              {!isLive ? <p className="muted">{t('doneDemo')}</p> : null}
              <Stores />
              <button className="link" type="button" onClick={reset}>
                {t('again')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
