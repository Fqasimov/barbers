import { brand, thanks } from '../content';
import { enter, Lockup } from '../ui';
import type { SlideProps } from './types';

/** 11 · Thank you: the logo, the line, the contacts. */
export function Thanks(_: SlideProps) {
  return (
    <div className="thanks">
      <div {...enter(0)}>
        <Lockup size={120} />
      </div>
      <h2 {...enter(1)}>{thanks.title}</h2>
      <p className="opening-tagline" {...enter(2)}>
        {thanks.line}
      </p>
      <p className="opening-contact" {...enter(3)}>
        <span>{brand.website}</span>
        <span className="dot" />
        <span>{brand.email}</span>
      </p>
    </div>
  );
}
