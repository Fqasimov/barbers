import { Easing } from 'remotion';

/** The brand: beige and black, with burgundy and silver in support (styles.css has the same tokens). */
export const color = {
  linen: '#F2EADD',
  linenDeep: '#E7DCC9',
  surface: '#FBF7F0',
  ink: '#141210',
  inkSoft: '#5B544B',
  burgundy: '#6B1A2A',
  silver: '#A3A8AE',
};

/** Emil Kowalski's curves, the ones the app uses. Never ease-in on UI. */
export const ease = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
};

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
