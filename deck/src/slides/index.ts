import { Built } from './Built';
import { Market } from './Market';
import { Model } from './Model';
import { Opening } from './Opening';
import { Problem } from './Problem';
import { ProductClients } from './ProductClients';
import { ProductSalons } from './ProductSalons';
import { Solution } from './Solution';
import { Team } from './Team';
import { Testers } from './Testers';
import { Thanks } from './Thanks';
import type { Slide } from './types';

/** The order of the deck. Reorder, remove or add slides here. */
export const slides: Slide[] = [
  { Component: Opening, chrome: false },
  { Component: Problem },
  { Component: Solution },
  { Component: ProductClients },
  { Component: ProductSalons },
  { Component: Testers },
  { Component: Market },
  { Component: Model },
  { Component: Built },
  { Component: Team },
  { Component: Thanks, chrome: false },
];
