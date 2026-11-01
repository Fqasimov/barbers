import { testers } from '../content';
import { enter, Kicker, Title } from '../ui';
import type { SlideProps } from './types';

/** 6 · Beta test: five anonymous testers, in their words. */
export function Testers(_: SlideProps) {
  return (
    <>
      <Kicker>{testers.kicker}</Kicker>
      <Title>{testers.title}</Title>
      <p className="lead" {...enter(2)}>
        {testers.subtitle}
      </p>
      <div className="notes">
        {testers.notes.map((n, i) => (
          <figure className="note" key={n.who} {...enter(i + 3)}>
            <blockquote>“{n.text}”</blockquote>
            <figcaption>{n.who}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
