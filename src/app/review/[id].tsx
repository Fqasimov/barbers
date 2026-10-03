import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { goBack, ScreenHeader } from '@/components/ScreenHeader';
import { StarInput } from '@/components/StarInput';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { Text } from '@/components/ui/Text';
import { reviewTags } from '@/data/reviews';
import { useSalon } from '@/hooks/useSalon';
import { firstName, ratingWord } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

const MAX = 500;
const WORD_IN = FadeIn.duration(160);

export default function WriteReview() {
  const { id, booking: bookingId } = useLocalSearchParams<{ id: string; booking?: string }>();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const salon = useSalon(id);
  const storedName = useStore((s) => s.name);
  const setStoredName = useStore((s) => s.setName);
  const addReview = useStore((s) => s.addReview);
  const booking = useStore((s) => s.bookings.find((b) => b.id === bookingId));

  const [rating, setRating] = useState(0);
  const [masterId, setMasterId] = useState<string | undefined>(booking?.masterId);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [name, setName] = useState(storedName);

  if (!salon) return null;
  const serviceName = booking ? salon.services.find((s) => s.id === booking.serviceIds[0])?.name : undefined;

  const submit = () => {
    if (!rating) return;
    const author = name.trim() || 'Guest';
    if (name.trim() && name.trim() !== storedName) setStoredName(name.trim());
    addReview({ salonId: salon.id, masterId, author, rating, text: text.trim(), tags, serviceName }, bookingId);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast('Thank you — your review is live.');
    goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader mode="close" inset={Platform.OS !== 'ios'} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="label" tone="muted">
          {salon.name}
        </Text>
        <Text variant="display" style={{ marginTop: 8 }} accessibilityRole="header">
          How was your visit?
        </Text>

        <View style={{ marginTop: 28, gap: 8 }}>
          <StarInput value={rating} onChange={setRating} />
          <Animated.View key={rating} entering={WORD_IN} style={{ minHeight: 28 }}>
            <Text variant="headline" italic tone={rating ? 'accent' : 'muted'}>
              {rating ? ratingWord(rating) : 'Tap or drag across the stars'}
            </Text>
          </Animated.View>
        </View>

        <Text variant="label" tone="muted" style={styles.label}>
          Who looked after you?
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

        <Text variant="label" tone="muted" style={styles.label}>
          What stood out?
        </Text>
        <View style={styles.wrap}>
          {reviewTags.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={tags.includes(t)}
              onPress={() => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}
            />
          ))}
        </View>

        <View style={styles.labelRow}>
          <Text variant="label" tone="muted" nativeID="review-text-label">
            Your review
          </Text>
          <Text variant="mono" tone="muted" style={{ fontSize: 11 }}>
            {text.length}/{MAX}
          </Text>
        </View>
        <Field
          value={text}
          onChangeText={setText}
          multiline
          multilineHeight={132}
          maxLength={MAX}
          placeholder="The cut, the welcome, the wait — what should others know?"
          accessibilityLabel="Your review"
        />

        <Text variant="label" tone="muted" style={styles.label}>
          Name on the review
        </Text>
        <Field
          value={name}
          onChangeText={setName}
          placeholder="Guest"
          maxLength={32}
          autoComplete="name"
          textContentType="name"
          accessibilityLabel="Name on the review"
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 14), borderColor: c.line, backgroundColor: c.bg },
        ]}
      >
        <Button
          label={rating ? 'Post review' : 'Choose a rating first'}
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
  label: { marginTop: 30, marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { paddingTop: 12, paddingHorizontal: gutter, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
});
