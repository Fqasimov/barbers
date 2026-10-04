import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Clock3, Search as SearchIcon, X } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SalonPhoto } from '@/components/SalonPhoto';
import { goBack } from '@/components/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { webReset } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { categories } from '@/data/categories';
import { categoryIcon } from '@/data/icons';
import { liveRating } from '@/data/ranking';
import { salons, serviceCatalogue } from '@/data/salons';
import type { Loc } from '@/i18n';
import { useI18n } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, radius } from '@/theme/tokens';

const POPULAR = ['fade', 'shave', 'gel', 'balayage', 'lami', 'hammam'];

/** Accent-insensitive: "kesim" finds "Kəsim", "seher" finds "Şəhər". */
const fold = (s: string) =>
  s
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[ıi̇]/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Matches a localized string in any of its languages. */
const allLangs = (loc: Loc) => `${loc.az} ${loc.ru} ${loc.en}`;

export default function SearchScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const localReviews = useStore((s) => s.reviews);
  const needle = fold(q.trim());

  const results = useMemo(() => {
    if (needle.length < 2) return null;
    const places = salons.filter((s) => fold(`${s.name} ${allLangs(s.kind)} ${s.district}`).includes(needle));
    const services = serviceCatalogue
      .filter((sv) => fold(allLangs(sv.name)).includes(needle))
      .map((sv) => {
        const offers = salons.flatMap((s) => s.services.filter((x) => x.key === sv.key));
        return { ...sv, places: offers.length, from: Math.min(...offers.map((o) => o.price)) };
      })
      .filter((sv) => sv.places > 0);
    const masters = salons
      .flatMap((salon) => salon.masters.map((master) => ({ salon, master })))
      .filter(({ master }) => fold(`${master.name} ${allLangs(master.role)}`).includes(needle))
      .slice(0, 6);
    return { places, services, masters };
  }, [needle]);

  const empty = results && !results.places.length && !results.services.length && !results.masters.length;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
        <IconButton icon={ChevronLeft} label={i18n.t('back')} onPress={goBack} />
        <View style={[styles.field, { backgroundColor: c.surface, borderColor: focused ? c.ink : c.line }]}>
          <SearchIcon size={18} color={c.inkSoft} strokeWidth={2} style={{ flexShrink: 0 }} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder={i18n.t('searchPlaceholder')}
            placeholderTextColor={c.inkMuted}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel={i18n.t('search')}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[styles.input, { color: c.ink }, webReset]}
          />
          {q ? (
            <IconButton icon={X} label={i18n.t('clearSearch')} variant="plain" size={32} onPress={() => setQ('')} />
          ) : null}
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + 40 }}
      >
        {!results ? (
          <>
            <Text variant="headline" style={styles.section}>
              {i18n.t('popular')}
            </Text>
            <View style={styles.wrap}>
              {POPULAR.map((key) => {
                const sv = serviceCatalogue.find((s) => s.key === key)!;
                return <Chip key={key} label={i18n.tx(sv.name)} onPress={() => setQ(i18n.tx(sv.name))} />;
              })}
            </View>
            <Text variant="headline" style={styles.section}>
              {i18n.t('browse')}
            </Text>
            {categories.map((cat, i) => {
              const Icon = categoryIcon[cat.id];
              return (
                <Row
                  key={cat.id}
                  label={i18n.tx(cat.plural)}
                  last={i === categories.length - 1}
                  onPress={() => router.push({ pathname: '/top-rated', params: { category: cat.id } })}
                >
                  <View style={[styles.icon, { backgroundColor: c.surface, borderColor: c.line }]}>
                    <Icon size={18} color={c.ink} strokeWidth={1.9} />
                  </View>
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    {i18n.tx(cat.plural)}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {salons.filter((s) => s.categories.includes(cat.id)).length}
                  </Text>
                  <ChevronRight size={18} color={c.inkMuted} strokeWidth={2} />
                </Row>
              );
            })}
          </>
        ) : empty ? (
          <View style={{ paddingVertical: 48, gap: 6 }}>
            <Text variant="title">{i18n.t('nothingFor', { q: q.trim() })}</Text>
            <Text tone="soft">{i18n.t('searchTry')}</Text>
          </View>
        ) : (
          <>
            {results.services.length ? (
              <>
                <Text variant="headline" style={styles.section}>
                  {i18n.t('tabServices')}
                </Text>
                {results.services.map((sv, i) => (
                  <Row
                    key={sv.key}
                    label={`${i18n.tx(sv.name)}, ${i18n.t('findSlot')}`}
                    last={i === results.services.length - 1}
                    onPress={() => router.push({ pathname: '/find', params: { service: sv.key } })}
                  >
                    <View style={[styles.icon, { backgroundColor: c.successSoft, borderColor: c.successSoft }]}>
                      <Clock3 size={18} color={c.success} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{i18n.tx(sv.name)}</Text>
                      <Text variant="caption" tone="soft">
                        {i18n.n(sv.places, 'place')} · {i18n.fromPrice(sv.from)} · {i18n.duration(sv.durationMin)}
                      </Text>
                    </View>
                    <Text variant="captionStrong" style={{ color: c.success }}>
                      {i18n.t('findSlot')}
                    </Text>
                  </Row>
                ))}
              </>
            ) : null}
            {results.places.length ? (
              <>
                <Text variant="headline" style={styles.section}>
                  {i18n.t('places')}
                </Text>
                {results.places.map((s, i) => (
                  <Row
                    key={s.id}
                    label={s.name}
                    last={i === results.places.length - 1}
                    onPress={() => router.push({ pathname: '/salon/[id]', params: { id: s.id } })}
                  >
                    <SalonPhoto salon={s} width={44} height={44} radius={radius.sm} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{s.name}</Text>
                      <Text variant="caption" tone="soft">
                        {i18n.tx(s.kind)} · {s.district}
                      </Text>
                    </View>
                    <RatingInline rating={liveRating(s, localReviews).rating} size="sm" />
                  </Row>
                ))}
              </>
            ) : null}
            {results.masters.length ? (
              <>
                <Text variant="headline" style={styles.section}>
                  {i18n.t('tabMasters')}
                </Text>
                {results.masters.map(({ salon, master }, i) => (
                  <Row
                    key={master.id}
                    label={`${master.name}, ${salon.name}`}
                    last={i === results.masters.length - 1}
                    onPress={() => router.push({ pathname: '/book/[id]', params: { id: salon.id, master: master.id } })}
                  >
                    <Avatar name={master.name} tone={master.tone} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{master.name}</Text>
                      <Text variant="caption" tone="soft">
                        {i18n.tx(master.role)} · {salon.name}
                      </Text>
                    </View>
                    <RatingInline rating={master.rating} size="sm" />
                  </Row>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Row({
  children,
  onPress,
  label,
  last,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  last?: boolean;
}) {
  const { c } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityLabel={label}
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
    >
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: gutter, paddingBottom: 8 },
  field: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 6,
  },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.regular, fontSize: 16, height: 46 },
  section: { marginTop: 26, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
