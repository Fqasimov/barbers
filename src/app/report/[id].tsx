import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { reportReview, type ReportReason } from '@/api/catalogue';
import { authErrorKey } from '@/auth/flow';
import { useSession } from '@/auth/useSession';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { useStore } from '@/store/useStore';

const REASONS: { id: ReportReason; label: StringKey }[] = [
  { id: 'offensive', label: 'rpOffensive' },
  { id: 'spam', label: 'rpSpam' },
  { id: 'fake', label: 'rpFake' },
  { id: 'other', label: 'rpOther' },
];

/** Report a review. The reporter stops seeing it at once; enough reports hide it for everyone. */
export default function ReportReview() {
  const i18n = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useSession((s) => s.session?.token ?? null);
  const hideReview = useStore((s) => s.hideReview);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!token || !reason || !id) return;
    setSending(true);
    try {
      await reportReview(token, id, reason, note.trim() || undefined);
      hideReview(id);
      toast(i18n.t('rpDone'));
      router.back();
    } catch (e) {
      toast(i18n.t(authErrorKey(e)), 'info');
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout
      mode="close"
      title={i18n.t('rpTitle')}
      subtitle={i18n.t('rpSub')}
      footer={
        token ? (
          <Button label={i18n.t('rpSend')} onPress={send} loading={sending} disabled={!reason} />
        ) : (
          <Button label={i18n.t('signIn')} onPress={() => router.push('/auth/sign-in')} />
        )
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {REASONS.map((r) => (
          <Chip key={r.id} label={i18n.t(r.label)} selected={reason === r.id} onPress={() => setReason(r.id)} />
        ))}
      </View>
      <FormField
        label={i18n.t('phReportNote')}
        placeholder={i18n.t('phReportNote')}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={500}
        autoCapitalize="sentences"
      />
    </AuthLayout>
  );
}
