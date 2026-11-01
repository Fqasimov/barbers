import { market } from '../content';
import { enter, Kicker, Title } from '../ui';
import type { SlideProps } from './types';

/** 7 · Market: who we serve, and what salons pay elsewhere (bars grow in when shown). */
export function Market({ shown }: SlideProps) {
  const max = Math.max(...market.chart.map((c) => c.value));
  return (
    <>
      <Kicker>{market.kicker}</Kicker>
      <Title style={{ maxWidth: 1500 }}>{market.title}</Title>
      <div className="market">
        <dl className="who">
          {market.who.map((w, i) => (
            <div key={w.label} {...enter(i + 2)}>
              <dt>{w.label}</dt>
              <dd>
                {w.text}
                {w.source ? <span className="source"> · {w.source}</span> : null}
              </dd>
            </div>
          ))}
          <p className="trend" {...enter(5)}>
            {market.trend}
          </p>
        </dl>
        <div className="chart" {...enter(3)}>
          <h3>{market.chartTitle}</h3>
          {market.chart.map((c, i) => (
            <div className={`bar-row${c.ours ? ' ours' : ''}`} key={c.name}>
              <span className="bar-name">{c.name}</span>
              <div className="bar-track">
                <i
                  style={{
                    transform: `scaleX(${shown ? c.value / max : 0})`,
                    transitionDelay: `${300 + i * 110}ms`,
                  }}
                />
              </div>
              <span className="bar-value">{c.value} ₼</span>
              <span className="bar-note">{c.note}</span>
            </div>
          ))}
          <p className="source">{market.chartSource}</p>
        </div>
      </div>
    </>
  );
}
