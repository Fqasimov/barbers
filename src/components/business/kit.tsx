import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { businessApi } from '@/api/business';
import { authErrorKey } from '@/auth/flow';
import type { Business } from '@/auth/types';
import { useSession } from '@/auth/useSession';
import { FormField } from '@/components/auth/FormField';
import { toast } from '@/components/Toaster';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { addDays, dayKey, startOfDay } from '@/lib/time';
import type { Loc } from '@/i18n/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadow } from '@/theme/tokens';

/**
 * The signed-in owner's business and a way to change it. `run` calls the API,
 * then re-reads the business so every screen shows the saved state.
 */
export function useOwner() {
  const i18n = useI18n();
  const token = useSession((s) => s.session?.token ?? null);
  const business = useSession((s) => s.session?.business ?? null);
  const setBusiness = useSession((s) => s.setBusiness);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setBusiness(await businessApi.get(token));
    } catch {
      // Keep what we have; the next action retries.
    }
  }, [token, setBusiness]);

  const run = useCallback(
    async <T,>(fn: (token: string) => Promise<T>, done?: string): Promise<T | undefined> => {
      if (!token) return undefined;
      setBusy(true);
      try {
        const out = await fn(token);
        setBusiness(await businessApi.get(token));
        if (done) toast(done);
        return out;
      } catch (e) {
        toast(i18n.t(authErrorKey(e)), 'info');
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [token, setBusiness, i18n],
  );

  return { token, business: business as Business | null, busy, run, refresh };
}

/** Owners type in one language; every language gets that text until it's translated. */
export function locFrom(text: string, previous?: Loc | null): Loc {
  const t = text.trim();
  if (!previous) return { az: t, ru: t, en: t };
  const was = Object.values(previous).find(Boolean) ?? '';
  return {
    az: !previous.az || previous.az === was ? t : previous.az,
    ru: !previous.ru || previous.ru === was ? t : previous.ru,
    en: !previous.en || previous.en === was ? t : previous.en,
  };
}

export function MenuRow({
  icon: Icon,
  title,
  detail,
  onPress,
  last,
}: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { c } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${title}, ${detail}` : title}
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
    >
      <View style={[styles.icon, { backgroundColor: c.sunken }]}>
        <Icon size={18} color={c.ink} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        {detail ? (
          <Text variant="caption" tone="soft" numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={c.inkMuted} strokeWidth={2} />
    </PressableScale>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  return <View style={[styles.card, { backgroundColor: c.surface }, shadow(c, 1)]}>{children}</View>;
}

/** "HH:MM", typed as digits. */
export const isClock = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const formatClock = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
};

export function TimeField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
}) {
  const i18n = useI18n();
  return (
    <FormField
      label={label}
      placeholder={i18n.t('phTime')}
      value={value}
      onChangeText={(v) => onChange(formatClock(v))}
      keyboardType="number-pad"
      maxLength={5}
      error={error}
    />
  );
}

/** Monday-first weekday toggles; values are 0 = Sunday … 6 = Saturday. */
export function DayPicker({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  const i18n = useI18n();
  return (
    <View style={styles.days}>
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const on = value.includes(d);
        // 7 Jan 2024 was a Sunday.
        const date = new Date(2024, 0, 7 + d);
        return (
          <Chip
            key={d}
            size="sm"
            label={i18n.weekdayShort(date)}
            accessibilityLabel={i18n.weekdayLong(date)}
            selected={on}
            onPress={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort())}
          />
        );
      })}
    </View>
  );
}

/** The next `count` days as a scrolling row of chips. */
export function DayChips({
  value,
  onChange,
  count = 30,
}: {
  value: Date;
  onChange: (d: Date) => void;
  count?: number;
}) {
  const i18n = useI18n();
  const [today] = useState(() => startOfDay(new Date()));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
      {Array.from({ length: count }, (_, i) => addDays(today, i)).map((d, i) => (
        <Chip
          key={dayKey(d)}
          size="sm"
          label={i < 2 ? i18n.relativeDay(d) : `${i18n.weekdayShort(d)} ${d.getDate()} ${i18n.monthShort(d)}`}
          accessibilityLabel={i18n.fullDate(d)}
          selected={dayKey(d) === dayKey(value)}
          onPress={() => onChange(d)}
        />
      ))}
    </ScrollView>
  );
}

/** A labelled group of controls inside a form. */
export function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string | null }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text variant="captionStrong" tone="soft">
        {label}
      </Text>
      {children}
      {error ? (
        <Text variant="caption" style={{ color: c.danger }} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dayRow: { gap: 8, paddingRight: 8 },
  card: { borderRadius: radius.lg, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
