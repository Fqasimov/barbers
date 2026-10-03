import type { RankedSalon } from '@/data/ranking';
import type { Coords } from '@/data/types';

export type MapCanvasProps = {
  items: RankedSalon[];
  activeId: string | null;
  origin: Coords;
  showsUser: boolean;
  onSelect: (id: string) => void;
  /** Space covered by overlays, so the fitted region stays visible. */
  insets: { top: number; bottom: number };
};
