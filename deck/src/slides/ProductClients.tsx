import { productClients } from '../content';
import { enter, Kicker, Phone, Title } from '../ui';
import type { SlideProps } from './types';

/** 4 · Product for clients: a real recording of the app, plus its main screens. */
export function ProductClients(_: SlideProps) {
  return (
    <div className="product">
      <div className="product-head">
        <Kicker>{productClients.kicker}</Kicker>
        <Title>{productClients.title}</Title>
      </div>
      <div className="product-body">
        <div className="phones-row">
          <div {...enter(2)}>
            <Phone video="video/browse.mp4" width={300} />
            <p className="phone-cap">Screen recording</p>
          </div>
          <div {...enter(3)}>
            <Phone src="screens/salon.jpg" width={300} />
            <p className="phone-cap">Salon</p>
          </div>
          <div {...enter(4)}>
            <Phone src="screens/book.jpg" width={300} />
            <p className="phone-cap">Booking</p>
          </div>
          <div {...enter(5)}>
            <Phone src="screens/compare.jpg" width={300} />
            <p className="phone-cap">Compare</p>
          </div>
        </div>
        <ol className="feature-list">
          {productClients.features.map((f, i) => (
            <li key={f.title} {...enter(i + 3)}>
              <b>{f.title}</b>
              <span>{f.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
