import { router } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authApi } from '@/auth';
import { useChallenge } from '@/auth/challenge';
import { authErrorKey, useFinishSignIn } from '@/auth/flow';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { OTP_LENGTH, OtpInput } from '@/components/auth/OtpInput';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

/** Enter the six-digit code that was emailed (registration or password reset). */
export default function Verify() {
  const { c } = useTheme();
  const i18n = useI18n();
  const finish = useFinishSignIn();
  const challenge = useChallenge((s) => s.challenge);
  const [code, setCode] = useState('');
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const submitted = useRef('');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = async (value = code) => {
    if (!challenge || value.length !== OTP_LENGTH || busy) return;
    submitted.current = value;
    setBusy(true);
    setError(null);
    try {
      if (challenge.purpose === 'register') {
        finish(await authApi.verifyEmail(challenge.email, value));
      } else {
        useChallenge.getState().setResetToken(await authApi.verifyResetCode(challenge.email, value));
        router.replace('/auth/new-password');
      }
    } catch (e) {
      setError(authErrorKey(e));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const onChange = (v: string) => {
    setCode(v);
    if (error) setError(null);
    // Submit as soon as the last digit lands (once per distinct code).
    if (v.length === OTP_LENGTH && v !== submitted.current) void submit(v);
  };

  if (!challenge) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
        <EmptyState
          icon={MailCheck}
          title={i18n.t('errOtpExpired')}
          body={i18n.t('forgotSub')}
          action={{ label: i18n.t('back'), onPress: () => router.back() }}
        />
      </View>
    );
  }

  const wait = Math.max(0, Math.ceil((new Date(challenge.resendAt).getTime() - now) / 1000));
  const resend = async () => {
    try {
      const next = await authApi.resendOtp(challenge.email, challenge.purpose);
      useChallenge.getState().set(next);
      submitted.current = '';
      setCode('');
      setError(null);
      toast(i18n.t('codeSent'));
    } catch (e) {
      setError(authErrorKey(e));
    }
  };

  return (
    <AuthLayout
      title={challenge.purpose === 'register' ? i18n.t('otpTitle') : i18n.t('forgotTitle')}
      subtitle={i18n.t('otpSub', { email: challenge.email })}
      footer={
        <Button
          label={i18n.t('verify')}
          onPress={() => submit()}
          loading={busy}
          disabled={code.length !== OTP_LENGTH}
        />
      }
    >
      <OtpInput value={code} onChange={onChange} error={!!error} label={i18n.t('otpLabel')} />
      {error ? (
        <Text variant="subhead" tone="danger" accessibilityLiveRegion="polite">
          {i18n.t(error)}
        </Text>
      ) : null}

      {challenge.demoCode ? (
        <View style={[styles.demo, { backgroundColor: c.sunken, borderColor: c.lineStrong }]}>
          <Text variant="captionStrong">{i18n.t('demoMailTitle')}</Text>
          <Text variant="caption" tone="soft">
            {i18n.t('demoMailBody')}
          </Text>
          <Text
            selectable
            style={[styles.demoCode, { color: c.ink }]}
            accessibilityLabel={challenge.demoCode.split('').join(' ')}
          >
            {challenge.demoCode}
          </Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <PressableScale onPress={resend} disabled={wait > 0} accessibilityRole="button" style={styles.link}>
          <Text variant="captionStrong" tone={wait > 0 ? 'muted' : 'ink'}>
            {wait > 0 ? i18n.t('resendIn', { s: wait }) : i18n.t('resend')}
          </Text>
        </PressableScale>
        <PressableScale onPress={() => router.back()} accessibilityRole="button" style={styles.link}>
          <Text variant="captionStrong" tone="soft">
            {i18n.t('changeEmail')}
          </Text>
        </PressableScale>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  demo: { gap: 4, padding: 14, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' },
  demoCode: { fontFamily: fonts.bold, fontSize: 26, letterSpacing: 6, marginTop: 6, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  link: { paddingVertical: 6 },
});
