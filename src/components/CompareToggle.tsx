import { ArrowLeftRight, Check } from 'lucide-react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useI18n } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { shadow } from '@/theme/tokens';

import { toast } from './Toaster';
import { PressableScale } from './ui/PressableScale';

/** Hook for anything that adds a venue to the compare tray. */
export function useCompareToggle(salonId: string) {
  const i18n = useI18n();
  const comparing = useStore((s) => s.compare.includes(salonId));
  const toggleCompare = useStore((s) => s.toggleCompare);
  const toggle = () => {
    const ok = toggleCompare(salonId);
    if (!ok) toast(i18n.t('compareLimit'), 'info');
  };
  return { comparing, toggle };
}

/** A small round "compare" toggle — sits on cards and rows, never inside another pressable. */
export function CompareToggle({
  salonId,
  size = 32,
  floating,
  style,
}: {
  salonId: string;
  size?: number;
  /** On top of a photo: solid surface and a soft shadow. */
  floating?: boolean;
  /** Placement of the hit area (e.g. absolute over a photo). */
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  const { comparing, toggle } = useCompareToggle(salonId);
  const Icon = comparing ? Check : ArrowLeftRight;
  return (
    <PressableScale
      onPress={toggle}
      haptic="selection"
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: comparing }}
      accessibilityLabel={comparing ? i18n.t('removeFromCompare') : i18n.t('addToCompare')}
      hitStyle={style}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: comparing ? c.primary : c.surface,
          borderColor: comparing ? c.primary : c.line,
        },
        floating && shadow(c, 1),
      ]}
    >
      <Icon size={size * 0.47} color={comparing ? c.onPrimary : c.ink} strokeWidth={2.1} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});
