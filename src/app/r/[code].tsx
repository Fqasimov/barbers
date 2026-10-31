import { router, useLocalSearchParams } from 'expo-router';
import { QrCode } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { qrReviewsApi, type QrInfo } from '@/api/catalogue';
import { authErrorKey, requireSignIn } from '@/auth/flow';
import { useSession } from '@/auth/useSession';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StarInput } from '@/components/StarInput';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Text } from '@/components/ui/Text';
import { useCatalogue } from '@/data/catalogue';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

/**
 * A scanned one-time review QR (https://yazilnow.az/r/<code> → usta://r/<code>).
 * The client signs in and rates the salon and the master separately.
 */
export default function QrReview() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const session = useSession((s) => s.session);
  const [info, setInfo] = useState<QrInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const [rating, setRating] = useState(0);
  const [masterRating, setMasterRating] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    qrReviewsApi.show(code).then(
      (x) => alive && setInfo(x),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [code]);

  if (failed || (info && !info.usable)) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader mode="close" />
        <EmptyState icon={QrCode} title={i18n.t('errCodeUsed')} body={i18n.t('qrBody')} />
      </View>
    );
  }
  if (!info) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const send = async () => {
    if (!requireSignIn('qrSignIn', i18n.t('qrSignIn'))) return;
    setSending(true);
    try {
      await qrReviewsApi.submit(session!.token, code, {
        rating,
        masterRating: info.masterId && masterRating ? masterRating : null,
        text: text.trim(),
      });
      toast(i18n.t('qrThanks'));
      void useCatalogue.getState().load(true);
      router.replace({ pathname: '/salon/[id]', params: { id: info.salonId } });
    } catch (e) {
      toast(i18n.t(authErrorKey(e)), 'info');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader mode="close" />
      <ScrollView
        contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="largeTitle">{i18n.t('qrReviewTitle', { salon: info.salonName ?? '' })}</Text>
        <View style={{ gap: 8 }}>
          <Text variant="headline">{i18n.t('qrRateSalon')}</Text>
          <StarInput value={rating} onChange={setRating} />
        </View>
        {info.masterId && info.masterName ? (
          <View style={{ gap: 8 }}>
            <Text variant="headline">{i18n.t('qrRateMaster', { name: info.masterName })}</Text>
            <StarInput value={masterRating} onChange={setMasterRating} />
          </View>
        ) : null}
        <Field
          value={text}
          onChangeText={setText}
          placeholder={i18n.t('notePlaceholder')}
          multiline
          multilineHeight={120}
          maxLength={500}
          accessibilityLabel={i18n.t('qrSubmit')}
        />
        <Button label={i18n.t('qrSubmit')} onPress={send} loading={sending} disabled={!rating} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
