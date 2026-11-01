import { model } from '../content';
import { enter, Kicker, Title } from '../ui';
import type { SlideProps } from './types';

/** 8 · Business model: the three plans exactly as in the app. */
export function Model(_: SlideProps) {
  return (
    <>
      <Kicker>{model.kicker}</Kicker>
      <Title>{model.title}</Title>
      <div className="plans">
        {model.plans.map((p, i) => (
          <div className={`plan${p.recommended ? ' rec' : ''}`} key={p.name} {...enter(i + 2)}>
            <div className="plan-head">
              <h3>{p.name}</h3>
              {p.recommended ? <span className="badge">Recommended</span> : null}
            </div>
            <p className="plan-price">
              {p.price} ₼<span>/ month</span>
            </p>
            <ul>
              {p.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="extras" {...enter(5)}>
        {model.extras.map((e, i) => (
          <span key={e}>
            {i ? <i className="dot" /> : null}
            {e}
          </span>
        ))}
      </p>
    </>
  );
}
