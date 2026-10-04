import { useLocalSearchParams } from 'expo-router';
import { CalendarClock, ChevronRight } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { SalonPhoto } from '@/components/SalonPhoto';
import { ScreenHeader } from '@/components/ScreenHeader';
import { bookSlot } from '@/components/SlotCard';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { categories, priceLevels } from '@/data/categories';
import { findSlots, type FindSort, type SlotResult, type TimeWindow } from '@/data/find';
import { categoryIcon } from '@/data/icons';
import { salons, serviceCatalogue } from '@/data/salons';
import type { CategoryId, PriceLevel } from '@/data/types';
import { useOrigin } from '@/hooks/useOrigin';
import { useI18n } from '@/i18n';
import { firstName } from '@/lib/format';
import { addDays, fmtClock, startOfDay } from '@/lib/time';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius } from '@/theme/tokens';

const WINDOWS: { id: TimeWindow; label: 'windowAny' | 'windowMorning' | 'windowAfternoon' | 'windowEvening' }[] = [
  { id: 'any', label: 'windowAny' },
  { id: 'morning', label: 'windowMorning' },
  { id: 'afternoon', label: 'windowAfternoon' },
  { id: 'evening', label: 'windowEvening' },
];

/** City-wide search: one service, one day, a time window — every free chair in Baku. */
export default function FindScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ service?: string }>();
  const { origin } = useOrigin();
  const bookings = useStore((s) => s.bookings);
  const localReviews = useStore((s) => s.reviews);
  const [now] = useState(() => new Date());

  const initialKey = serviceCatalogue.some((s) => s.key === params.service) ? params.service! : 'fade';
  const [serviceKey, setServiceKey] = useState(initialKey);
  const [category, setCategory] = useState<CategoryId>(serviceCatalogue.find((s) => s.key === initialKey)!.category);
  const [dayOffset, setDayOffset] = useState(0);
  const [window, setWindow] = useState<TimeWindow>('any');
  const [prices, setPrices] = useState<PriceLevel[]>([]);
  const [womenOnly, setWomenOnly] = useState(false);
  const [english, setEnglish] = useState(false);
  const [sort, setSort] = useState<FindSort>('earliest');

  const date = addDays(startOfDay(now), dayOffset);
  const results = useMemo(
    () =>
      findSlots({
        salons,
        serviceKey,
        date,
        window,
        origin,
        bookings,
        localReviews,
        now,
        priceLevels: prices,
        womenOnly,
        englishSpeaking: english,
        sort,
      }).slice(0, 60),
    // `date` is derived from dayOffset.
    [serviceKey, dayOffset, window, origin, bookings, localReviews, now, prices, womenOnly, english, sort], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const placeCount = new Set(results.map((r) => r.salon.id)).size;
  const services = serviceCatalogue.filter((s) => s.category === category);

  const header = (
    <View>
      <View style={{ paddingHorizontal: gutter }}>
        <Text variant="largeTitle" accessibilityRole="header">
          {i18n.t('findSlot')}
        </Text>
        <Text variant="subhead" tone="soft" style={{ marginTop: 4 }}>
          {i18n.t('findSlotHint')}
        </Text>
      </View>

      <Label text={i18n.t('service')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            size="sm"
            icon={categoryIcon[cat.id]}
            label={i18n.tx(cat.label)}
            selected={category === cat.id}
            onPress={() => {
              setCategory(cat.id);
              setServiceKey(serviceCatalogue.find((s) => s.category === cat.id)!.key);
            }}
          />
        ))}
      </ScrollView>
      <View style={[styles.wrap, { marginTop: 10 }]}>
        {services.map((s) => (
          <PressableScale
            key={s.key}
            onPress={() => setServiceKey(s.key)}
            haptic="selection"
            accessibilityRole="radio"
            accessibilityState={{ selected: serviceKey === s.key }}
            accessibilityLabel={i18n.tx(s.name)}
            style={[
              styles.service,
              {
                backgroundColor: serviceKey === s.key ? c.primary : c.surface,
                borderColor: serviceKey === s.key ? c.primary : c.line,
              },
            ]}
          >
            <Text variant="callout" style={{ color: serviceKey === s.key ? c.onPrimary : c.ink }}>
              {i18n.tx(s.name)}
            </Text>
            <Text variant="caption" style={{ color: serviceKey === s.key ? c.onPrimary : c.inkMuted, opacity: 0.85 }}>
              {i18n.duration(s.durationMin)}
            </Text>
          </PressableScale>
        ))}
      </View>

      <Label text={i18n.t('day')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(startOfDay(now), i);
          const label =
            i === 0 ? i18n.t('today') : i === 1 ? i18n.t('tomorrow') : `${i18n.weekdayShort(d)} ${d.getDate()}`;
          return <Chip key={i} label={label} selected={dayOffset === i} onPress={() => setDayOffset(i)} />;
        })}
      </ScrollView>

      <Label text={i18n.t('time')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {WINDOWS.map((w) => (
          <Chip key={w.id} label={i18n.t(w.label)} selected={window === w.id} onPress={() => setWindow(w.id)} />
        ))}
      </ScrollView>

      <Label text={i18n.t('filters')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {priceLevels.map((p) => (
          <Chip
            key={p.level}
            size="sm"
            label={'₼'.repeat(p.level)}
            accessibilityLabel={i18n.tx(p.hint)}
            selected={prices.includes(p.level)}
            onPress={() =>
              setPrices((cur) => (cur.includes(p.level) ? cur.filter((l) => l !== p.level) : [...cur, p.level]))
            }
          />
        ))}
        <Chip
          size="sm"
          label={i18n.t('womenOnlyFilter')}
          selected={womenOnly}
          onPress={() => setWomenOnly(!womenOnly)}
        />
        <Chip size="sm" label={i18n.t('englishFilter')} selected={english} onPress={() => setEnglish(!english)} />
      </ScrollView>

      <SegmentedControl<FindSort>
        value={sort}
        onChange={setSort}
        options={[
          { value: 'earliest', label: i18n.t('sortEarliest') },
          { value: 'cheapest', label: i18n.t('sortCheapest') },
          { value: 'nearest', label: i18n.t('sortNearest') },
          { value: 'rating', label: i18n.t('sortRating') },
        ]}
        style={{ marginHorizontal: gutter, marginTop: 22 }}
      />

      <Text variant="headline" style={{ paddingHorizontal: gutter, marginTop: 22, marginBottom: 4 }}>
        {i18n.t('slotsAcross', { slots: i18n.n(results.length, 'slot'), places: i18n.n(placeCount, 'place') })}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader />
      <FlatList
        data={results}
        keyExtractor={(r) => `${r.salon.id}-${r.time}`}
        renderItem={({ item, index }) => <SlotRow slot={item} last={index === results.length - 1} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState icon={CalendarClock} title={i18n.t('fullyBooked')} body={i18n.t('noSlots')} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Text variant="headline" style={{ paddingHorizontal: gutter, marginTop: 22, marginBottom: 10 }}>
      {text}
    </Text>
  );
}

const SlotRow = memo(function SlotRow({ slot, last }: { slot: SlotResult; last?: boolean }) {
  const { c } = useTheme();
  const i18n = useI18n();
  return (
    <PressableScale
      onPress={() => bookSlot(slot)}
      scaleTo={0.985}
      accessibilityLabel={`${fmtClock(slot.time)}, ${slot.salon.name}, ${firstName(slot.master.name)}, ${i18n.price(slot.service.price)}`}
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
    >
      <View style={[styles.time, { backgroundColor: c.successSoft }]}>
        <Text variant="bodyStrong" style={{ color: c.success, fontVariant: ['tabular-nums'] }}>
          {fmtClock(slot.time)}
        </Text>
      </View>
      <SalonPhoto salon={slot.salon} width={44} height={44} radius={radius.sm} />
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {slot.salon.name}
        </Text>
        <Text variant="caption" tone="soft" numberOfLines={1}>
          {firstName(slot.master.name)} · {slot.salon.district} · {i18n.distance(slot.distance)}
        </Text>
        <RatingInline rating={slot.master.rating} size="sm" />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text variant="price">{i18n.price(slot.service.price)}</Text>
        <ChevronRight size={16} color={c.inkMuted} strokeWidth={2} />
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  chips: { paddingHorizontal: gutter, gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: gutter },
  service: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, marginHorizontal: gutter },
  time: { width: 64, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
