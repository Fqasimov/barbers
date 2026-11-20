import type { LucideIcon } from 'lucide-react-native';
import { Brush, Eye, Gem, Leaf, Palette, Scissors, Shirt, Sparkles } from 'lucide-react-native';

import type { CategoryId } from './types';

export const categoryIcon: Record<CategoryId, LucideIcon> = {
  barber: Scissors,
  hair: Brush,
  nails: Gem,
  brows: Eye,
  spa: Leaf,
  makeup: Palette,
  aesthetics: Sparkles,
  couture: Shirt,
};
