import { router } from 'expo-router';
import { ChevronRight, Heart } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SalonCover } from '@/components/SalonCover';
import { useTabBarInset } from '@/components/TabBar';
import { Avatar } from '@/components/ui/Avatar';
import { webReset } from '@/components/ui/Field';
import { PressableScale } from '@/components/ui/PressableScale';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/constants/brand';
import { liveRating } from '@/data/ranking';
import { salonById } from '@/data/salons';
import { useStore, type Appearance } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, iconStroke, radius } from '@/theme/tokens';

export default function ProfileScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  const name = useStore((s) => s.name);
  const setName = useStore((s) => s.setName);
  const appearance = useStore((s) => s.appearance);
  const setAppearance = useStore((s) => s.setAppearance);
  const favorites = useStore((s) => s.favorites);
  const reviews = useStore((s) => s.reviews);
  const bookings = useStore((s) => s.bookings);

  const saved = useMemo(() => favorites.map((id) => salonById(id)).filter((s) => !!s), [favorites]);
  const visits = bookings.filter((b) => b.status === 'upcoming').length;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottom, paddingHorizontal: gutter }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text variant="label" tone="muted">
        Profile
      </Text>

      <View style={styles.identity}>
        <Avatar name={name || 'You'} tone="ink" size={64} />
        <View style={{ flex: 1 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Add your name"
            placeholderTextColor={c.inkMuted}
            accessibilityLabel="Your name"
            accessibilityHint="Shown on reviews you write"
            maxLength={32}
            style={[styles.nameInput, { color: c.ink }, webReset]}
          />
          <Text variant="caption" tone="soft">
            Shown on the reviews you write
          </Text>
        </View>
      </View>

      <View style={[styles.stats, { borderColor: c.line }]}>
        <Stat value={visits} label="Booked" />
        <View style={[styles.statDivider, { backgroundColor: c.line }]} />
        <Stat value={reviews.length} label="Reviews" />
        <View style={[styles.statDivider, { backgroundColor: c.line }]} />
        <Stat value={favorites.length} label="Saved" />
      </View>

      <Text variant="title" style={styles.sectionTitle} accessibilityRole="header">
        Saved places
      </Text>
      {saved.length === 0 ? (
        <View style={[styles.hint, { borderColor: c.line }]}>
          <Heart size={18} color={c.inkSoft} strokeWidth={iconStroke} />
          <Text variant="callout" tone="soft" style={{ flex: 1 }}>
            Tap the heart on any venue to keep it here for next time.
          </Text>
        </View>
      ) : (
        <View>
          {saved.map((s, i) => {
            const live = liveRating(s, reviews);
            return (
              <PressableScale
                key={s.id}
                onPress={() => router.push({ pathname: '/salon/[id]', params: { id: s.id } })}
                scaleTo={0.985}
                accessibilityLabel={s.name}
                style={[
                  styles.row,
                  i < saved.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
                ]}
              >
                <SalonCover salon={s} width={52} height={52} radius={radius.sm} variant="thumb" />
                <View style={{ flex: 1 }}>
                  <Text variant="serif" numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text variant="caption" tone="soft" numberOfLines={1}>
                    {s.kind} · {s.district}
                  </Text>
                </View>
                <RatingInline rating={live.rating} size="sm" />
                <ChevronRight size={18} color={c.inkMuted} strokeWidth={iconStroke} />
              </PressableScale>
            );
          })}
        </View>
      )}

      <Text variant="title" style={styles.sectionTitle} accessibilityRole="header">
        Appearance
      </Text>
      <SegmentedControl<Appearance>
        value={appearance}
        onChange={setAppearance}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />

      <View style={styles.colophon}>
        <Text style={{ fontFamily: fonts.displayLightItalic, fontSize: 28, color: c.inkMuted }}>{APP_NAME}</Text>
        <Text variant="caption" tone="muted" align="center">
          Version 1.0 · Made for Baku’s barbers, salons and the masters behind them.
        </Text>
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }} accessible accessibilityLabel={`${value} ${label}`}>
      <Text style={{ fontFamily: fonts.displayLight, fontSize: 30, lineHeight: 34 }}>{value}</Text>
      <Text variant="label" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  nameInput: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, padding: 0, minHeight: 36 },
  stats: {
    flexDirection: 'row',
    marginTop: 28,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statDivider: { width: StyleSheet.hairlineWidth },
  sectionTitle: { marginTop: 36, marginBottom: 14 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  colophon: { alignItems: 'center', gap: 6, marginTop: 48, paddingHorizontal: 32 },
});
