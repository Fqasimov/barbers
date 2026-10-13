import { useFocusEffect } from 'expo-router';
import { MessageSquareText } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi } from '@/api/business';
import { authErrorKey } from '@/auth/flow';
import { FormField } from '@/components/auth/FormField';
import { Card, useOwner } from '@/components/business/kit';
import { EmptyState } from '@/components/EmptyState';
import { ReviewCard } from '@/components/ReviewCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useSalonById } from '@/data/catalogue';
import type { Review } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius } from '@/theme/tokens';

/** The salon's reviews, newest first, each with a public reply. */
export default function BusinessReviews() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { token, business } = useOwner();
  const salon = useSalonById(business?.salonId ?? undefined);
  const [items, setItems] = useState<Review[] | null>(null);
  const [next, setNext] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (page = 1) => {
      if (!token) return;
      try {
        const res = await businessApi.reviews(token, page);
        setItems((prev) => (page === 1 ? res.data : [...(prev ?? []), ...res.data]));
        setNext(res.nextPage);
      } catch (e) {
        toast(i18n.t(authErrorKey(e)), 'info');
        setItems((prev) => prev ?? []);
      }
    },
    [token, i18n],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const saved = (r: Review) => setItems((list) => list?.map((x) => (x.id === r.id ? r : x)) ?? null);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('reviewsTitle')} />
      <ScrollView
        contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {items === null ? (
          <ActivityIndicator color={c.inkSoft} style={{ marginTop: 48 }} />
        ) : items.length ? (
          <>
            <View style={[styles.hint, { backgroundColor: c.sunken }]}>
              <Text variant="caption" tone="soft">
                {i18n.t('rvHint')}
              </Text>
            </View>
            <Card>
              {items.map((r, i) => (
                <ReviewCard key={r.id} review={r} salon={salon} last={i === items.length - 1}>
                  <ReplyBox review={r} token={token} onSaved={saved} />
                </ReviewCard>
              ))}
            </Card>
            {next ? <Button label={i18n.t('showMore')} variant="secondary" onPress={() => void load(next)} /> : null}
          </>
        ) : (
          <EmptyState icon={MessageSquareText} title={i18n.t('rvEmptyTitle')} body={i18n.t('rvEmptyBody')} />
        )}
      </ScrollView>
    </View>
  );
}

function ReplyBox({ review, token, onSaved }: { review: Review; token: string | null; onSaved: (r: Review) => void }) {
  const i18n = useI18n();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(review.reply ?? '');
  const [busy, setBusy] = useState(false);

  const post = async (value: string) => {
    if (!token) return;
    setBusy(true);
    try {
      onSaved(await businessApi.reply(token, review.id, value));
      setOpen(false);
      toast(i18n.t('savedToast'));
    } catch (e) {
      toast(i18n.t(authErrorKey(e)), 'info');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <View style={styles.actions}>
        <Button
          label={review.reply ? i18n.t('rvEditReply') : i18n.t('rvReply')}
          size="sm"
          variant="secondary"
          onPress={() => setOpen(true)}
        />
      </View>
    );
  }
  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      <FormField
        label={i18n.t('rvReply')}
        placeholder={i18n.t('phReply')}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={1000}
        autoCapitalize="sentences"
        autoFocus
      />
      <View style={styles.actions}>
        <Button
          label={i18n.t('rvPost')}
          size="sm"
          loading={busy}
          disabled={!text.trim()}
          onPress={() => void post(text.trim())}
        />
        {review.reply ? (
          <Button label={i18n.t('rvRemoveReply')} size="sm" variant="dangerGhost" onPress={() => void post('')} />
        ) : null}
        <Button label={i18n.t('cancel')} size="sm" variant="ghost" onPress={() => setOpen(false)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { padding: 12, borderRadius: radius.md },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 },
});
