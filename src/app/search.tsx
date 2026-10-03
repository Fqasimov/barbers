import { router } from 'expo-router';
import { ArrowUpRight, ChevronLeft, Search as SearchIcon, X } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SalonCover } from '@/components/SalonCover';
import { goBack } from '@/components/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { webReset } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { categories } from '@/data/categories';
import { liveRating } from '@/data/ranking';
import { salons } from '@/data/salons';
import type { Master, Salon, Service } from '@/data/types';
import { fmtPrice } from '@/lib/format';
import { fmtDuration } from '@/lib/time';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, iconStroke, radius } from '@/theme/tokens';

const POPULAR = ['Skin fade', 'Hot towel shave', 'Gel manicure', 'Balayage', 'Brow lamination', 'Hammam ritual'];

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

export default function SearchScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const localReviews = useStore((s) => s.reviews);
  const needle = fold(q.trim());

  const results = useMemo(() => {
    if (needle.length < 2) return null;
    const places = salons.filter((s) => fold(`${s.name} ${s.kind} ${s.district}`).includes(needle));
    const services: { salon: Salon; service: Service }[] = salons
      .flatMap((salon) => salon.services.map((service) => ({ salon, service })))
      .filter(({ service }) => fold(service.name).includes(needle))
      .sort((a, b) => liveRating(b.salon, localReviews).rating - liveRating(a.salon, localReviews).rating)
      .slice(0, 8);
    const masters: { salon: Salon; master: Master }[] = salons
      .flatMap((salon) => salon.masters.map((master) => ({ salon, master })))
      .filter(({ master }) => fold(`${master.name} ${master.role}`).includes(needle))
      .slice(0, 6);
    return { places, services, masters };
  }, [needle, localReviews]);

  const empty = results && !results.places.length && !results.services.length && !results.masters.length;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
        <IconButton icon={ChevronLeft} label="Back" onPress={goBack} />
        <View style={[styles.field, { backgroundColor: c.surface, borderColor: focused ? c.ink : c.line }]}>
          <SearchIcon size={18} color={c.inkSoft} strokeWidth={iconStroke} style={{ flexShrink: 0 }} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Salons, services or masters"
            placeholderTextColor={c.inkMuted}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[styles.input, { color: c.ink }, webReset]}
          />
          {q ? <IconButton icon={X} label="Clear search" variant="plain" size={32} onPress={() => setQ('')} /> : null}
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + 40 }}
      >
        {!results ? (
          <>
            <Text variant="label" tone="muted" style={styles.section}>
              Popular this week
            </Text>
            <View style={styles.wrap}>
              {POPULAR.map((p) => (
                <Chip key={p} label={p} onPress={() => setQ(p)} />
              ))}
            </View>
            <Text variant="label" tone="muted" style={styles.section}>
              Browse
            </Text>
            {categories.map((cat, i) => (
              <PressableScale
                key={cat.id}
                onPress={() => router.push({ pathname: '/top-rated', params: { category: cat.id } })}
                scaleTo={0.985}
                accessibilityLabel={`Best ${cat.plural}`}
                style={[
                  styles.browse,
                  i < categories.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
                ]}
              >
                <Text variant="headline" style={{ flex: 1 }}>
                  {cat.plural}
                </Text>
                <Text variant="mono" tone="muted">
                  {salons.filter((s) => s.categories.includes(cat.id)).length}
                </Text>
                <ArrowUpRight size={18} color={c.inkSoft} strokeWidth={iconStroke} />
              </PressableScale>
            ))}
          </>
        ) : empty ? (
          <View style={{ paddingVertical: 48, gap: 6 }}>
            <Text variant="title">Nothing for “{q.trim()}”</Text>
            <Text tone="soft">Try a service like “fade” or a district like “Nizami”.</Text>
          </View>
        ) : (
          <>
            {results.places.length ? (
              <>
                <Text variant="label" tone="muted" style={styles.section}>
                  Places
                </Text>
                {results.places.map((s) => (
                  <Row key={s.id} onPress={() => openSalon(s.id)} label={s.name}>
                    <SalonCover salon={s} width={48} height={48} radius={radius.sm} variant="thumb" />
                    <View style={{ flex: 1 }}>
                      <Text variant="serif">{s.name}</Text>
                      <Text variant="caption" tone="soft">
                        {s.kind} · {s.district}
                      </Text>
                    </View>
                    <RatingInline rating={liveRating(s, localReviews).rating} size="sm" />
                  </Row>
                ))}
              </>
            ) : null}
            {results.services.length ? (
              <>
                <Text variant="label" tone="muted" style={styles.section}>
                  Services
                </Text>
                {results.services.map(({ salon, service }) => (
                  <Row
                    key={service.id}
                    label={`${service.name} at ${salon.name}`}
                    onPress={() =>
                      router.push({ pathname: '/book/[id]', params: { id: salon.id, services: service.id } })
                    }
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="serif">{service.name}</Text>
                      <Text variant="caption" tone="soft">
                        {salon.name} · {fmtDuration(service.durationMin)}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: fonts.displayMedium, fontSize: 16, color: c.ink }}>
                      {fmtPrice(service.price)}
                    </Text>
                  </Row>
                ))}
              </>
            ) : null}
            {results.masters.length ? (
              <>
                <Text variant="label" tone="muted" style={styles.section}>
                  Masters
                </Text>
                {results.masters.map(({ salon, master }) => (
                  <Row
                    key={master.id}
                    label={`${master.name} at ${salon.name}`}
                    onPress={() => router.push({ pathname: '/book/[id]', params: { id: salon.id, master: master.id } })}
                  >
                    <Avatar name={master.name} tone={master.tone} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text variant="serif">{master.name}</Text>
                      <Text variant="caption" tone="soft">
                        {master.role} · {salon.name}
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

const openSalon = (id: string) => router.push({ pathname: '/salon/[id]', params: { id } });

function Row({ children, onPress, label }: { children: ReactNode; onPress: () => void; label: string }) {
  const { c } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityLabel={label}
      style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
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
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 6,
  },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 16, height: 46 },
  section: { marginTop: 28, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  browse: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
});
