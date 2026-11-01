import { built } from '../content';
import { enter, Kicker, Phone, Title } from '../ui';
import type { SlideProps } from './types';

/** 9 · Where we are: what exists today, and the next three steps. */
export function Built(_: SlideProps) {
  return (
    <div className="split">
      <div className="split-main">
        <Kicker>{built.kicker}</Kicker>
        <Title>{built.title}</Title>
        <div className="built">
          <ul className="checks">
            {built.done.map((d, i) => (
              <li key={d} {...enter(i + 2)}>
                {d}
              </li>
            ))}
          </ul>
          <div {...enter(7)}>
            <h3 className="next-title">Next</h3>
            <ol className="next">
              {built.next.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <div className="phones-pair" {...enter(3)}>
        <Phone src="screens/home.jpg" width={320} style={{ transform: 'translateY(20px) rotate(-2deg)' }} />
        <Phone
          src="screens/tools.jpg"
          width={320}
          style={{ transform: 'translateY(-30px) rotate(2deg)', marginLeft: -50 }}
        />
      </div>
    </div>
  );
}
