import { solution } from '../content';
import { enter, Kicker, Phone, Title } from '../ui';
import type { SlideProps } from './types';

/** 3 · Solution: one map of every free time; three pillars and what nobody else does. */
export function Solution(_: SlideProps) {
  return (
    <div className="split">
      <div className="split-main">
        <Kicker>{solution.kicker}</Kicker>
        <Title>{solution.title}</Title>
        <div className="pillars">
          {solution.pillars.map((p, i) => (
            <div className="pillar" key={p.title} {...enter(i + 2)}>
              <h3>{p.title}</h3>
              <ul>
                {p.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="unique" {...enter(6)}>
          {solution.unique}
        </p>
      </div>
      <div className="phones-pair" {...enter(3)}>
        <Phone src="screens/find.jpg" width={330} style={{ transform: 'translateY(40px) rotate(-3deg)' }} />
        <Phone
          src="screens/map.jpg"
          width={330}
          style={{ transform: 'translateY(-30px) rotate(2deg)', marginLeft: -60 }}
        />
      </div>
    </div>
  );
}
