import { Easing } from 'remotion';

/** Same palette as the app (src/theme/tokens.ts) and the promo (promo/src/theme.ts). */
export const color = {
  linen: '#F3EFE8',
  surface: '#FFFFFF',
  ink: '#141210',
  inkSoft: '#5B554C',
  nar: '#B4233C',
};

/** Emil Kowalski's curves, the ones the app uses. Never ease-in on UI. */
export const ease = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
};

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
