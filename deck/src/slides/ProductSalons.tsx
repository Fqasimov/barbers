import { productSalons } from '../content';
import { enter, Kicker, Phone, Title } from '../ui';
import type { SlideProps } from './types';

/** 5 · Product for salons: signing up and starting the trial, then the tools. */
export function ProductSalons(_: SlideProps) {
  return (
    <div className="split">
      <div className="split-main">
        <Kicker>{productSalons.kicker}</Kicker>
        <Title>{productSalons.title}</Title>
        <ul className="checks">
          {productSalons.features.map((f, i) => (
            <li key={f} {...enter(i + 2)}>
              {f}
            </li>
          ))}
        </ul>
        <p className="lead" {...enter(9)}>
          {productSalons.note}
        </p>
      </div>
      <div className="phones-pair" {...enter(3)}>
        <Phone video="video/trial.mp4" width={330} style={{ transform: 'translateY(30px)' }} />
        <Phone
          src="screens/qr.jpg"
          width={300}
          style={{ transform: 'translateY(-40px) rotate(2deg)', marginLeft: -40 }}
        />
      </div>
    </div>
  );
}
