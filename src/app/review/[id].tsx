import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { BadgeCheck } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { goBack, ScreenHeader } from '@/components/ScreenHeader';
import { StarInput } from '@/components/StarInput';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { Text } from '@/components/ui/Text';
import { reviewTags, type TagId } from '@/data/reviews';
import { useSalon } from '@/hooks/useSalon';
import { useI18n } from '@/i18n';
import { firstName } from '@/lib/format';
import { isCompleted, useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius } from '@/theme/tokens';

const MAX = 500;
const WORD_IN = FadeIn.duration(160);

/** Reviews are tied to a completed booking — no booking, no review. */
export default function WriteReview() {
  const { id, booking: bookingId } = useLocalSearchParams<{ id: string; booking?: string }>();
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const salon = useSalon(id);
  const storedName = useStore((s) => s.name);
  const setStoredName = useStore((s) => s.setName);
  const addReview = useStore((s) => s.addReview);
  const booking = useStore((s) => s.bookings.find((b) => b.id === bookingId));

  const [rating, setRating] = useState(0);
  const [masterId, setMasterId] = useState<string | undefined>(booking?.masterId);
  const [tags, setTags] = useState<TagId[]>([]);
  const [text, setText] = useState('');
  const [name, setName] = useState(storedName);

  if (!salon) return null;

  const eligible = booking && booking.salonId === salon.id && !booking.reviewed && isCompleted(booking);
  if (!eligible) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader mode="close" inset={Platform.OS !== 'ios'} />
        <EmptyState icon={BadgeCheck} title={i18n.t('reviewLockedTitle')} body={i18n.t('reviewLockedBody')} />
      </View>
    );
  }

  const service = salon.services.find((s) => s.id === booking.serviceIds[0]);

  const submit = () => {
    if (!rating) return;
    const author = name.trim() || i18n.t('guest');
    if (name.trim() && name.trim() !== storedName) setStoredName(name.trim());
    const ok = addReview(
      { salonId: salon.id, masterId, author, rating, text: text.trim(), tags, serviceName: service?.name },
      booking.id,
    );
    if (!ok) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast(i18n.t('thanksToast'));
    goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader mode="close" inset={Platform.OS !== 'ios'} title={salon.name} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.visit, { backgroundColor: c.successSoft }]}>
          <BadgeCheck size={16} color={c.success} strokeWidth={2} />
          <Text variant="captionStrong" style={{ color: c.success, flex: 1 }}>
            {i18n.t('visitOn', {
              date: i18n.shortDate(new Date(booking.start)),
              service: service ? i18n.tx(service.name) : '',
            })}
          </Text>
        </View>

        <Text variant="largeTitle" style={{ marginTop: 16 }} accessibilityRole="header">
          {i18n.t('howWasVisit')}
        </Text>

        <View style={{ marginTop: 22, gap: 8 }}>
          <StarInput value={rating} onChange={setRating} />
          <Animated.View key={rating} entering={WORD_IN} style={{ minHeight: 26 }}>
            <Text variant="headline" tone={rating ? 'ink' : 'muted'}>
              {rating ? i18n.ratingWord(rating) : i18n.t('tapOrDrag')}
            </Text>
          </Animated.View>
        </View>

        <Text variant="headline" style={styles.label}>
          {i18n.t('whoLooked')}
        </Text>
        <View style={styles.wrap}>
          {salon.masters.map((m) => (
            <Chip
              key={m.id}
              label={firstName(m.name)}
              selected={masterId === m.id}
              onPress={() => setMasterId(masterId === m.id ? undefined : m.id)}
            />
          ))}
        </View>

        <Text variant="headline" style={styles.label}>
          {i18n.t('whatStood')}
        </Text>
        <View style={styles.wrap}>
          {reviewTags.map((t) => (
            <Chip
              key={t.id}
              label={i18n.tx(t.label)}
              selected={tags.includes(t.id)}
              onPress={() => setTags((cur) => (cur.includes(t.id) ? cur.filter((x) => x !== t.id) : [...cur, t.id]))}
            />
          ))}
        </View>

        <View style={styles.labelRow}>
          <Text variant="headline">{i18n.t('yourReview')}</Text>
          <Text variant="caption" tone="muted">
            {text.length}/{MAX}
          </Text>
        </View>
        <Field
          value={text}
          onChangeText={setText}
          multiline
          multilineHeight={132}
          maxLength={MAX}
          placeholder={i18n.t('reviewPlaceholder')}
          accessibilityLabel={i18n.t('yourReview')}
        />

        <Text variant="headline" style={styles.label}>
          {i18n.t('nameOnReview')}
        </Text>
        <Field
          value={name}
          onChangeText={setName}
          placeholder={i18n.t('guest')}
          maxLength={32}
          autoComplete="name"
          textContentType="name"
          accessibilityLabel={i18n.t('nameOnReview')}
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 14), borderColor: c.line, backgroundColor: c.surface },
        ]}
      >
        <Button
          label={rating ? i18n.t('postReview') : i18n.t('chooseRatingFirst')}
          disabled={!rating}
          onPress={submit}
          haptic="none"
          hitStyle={{ flex: 1 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  visit: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: radius.sm, marginTop: 4 },
  label: { marginTop: 28, marginBottom: 12 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 28,
    marginBottom: 12,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { paddingTop: 12, paddingHorizontal: gutter, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
});
