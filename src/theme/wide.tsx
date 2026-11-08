import { createContext, useContext } from 'react';

/**
 * True when a screen is on the salon panel (web) and the window is wide enough for a desktop layout:
 * two columns instead of one. Set by the root layout; false on phones and in the client app.
 */
export const WideContext = createContext(false);
export const useWide = () => useContext(WideContext);

export const WIDE_MIN = 1024;

/** Side margin of the panel on a wide window: grows with the screen, so content never touches the edges. */
export const panelInset = (width: number) => (width >= WIDE_MIN ? Math.min(Math.round(width * 0.06), 140) : 0);
