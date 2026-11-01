import { brand, team } from '../content';
import { enter, Kicker, Title } from '../ui';
import type { SlideProps } from './types';

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

/** 10 · Team, then contact. */
export function Team(_: SlideProps) {
  return (
    <>
      <Kicker>{team.kicker}</Kicker>
      <Title>{team.title}</Title>
      <div className="team">
        {team.people.map((p, i) => (
          <div className="person" key={i} {...enter(i + 2)}>
            <span className="avatar">{initials(p.name)}</span>
            <h3>{p.name}</h3>
            <p className="role">{p.role}</p>
            <p className="bio">{p.bio}</p>
          </div>
        ))}
      </div>
      <p className="contact" {...enter(6)}>
        <span>{brand.website}</span>
        <i className="dot" />
        <span>{brand.email}</span>
      </p>
    </>
  );
}
