import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { businessApi } from '@/api/business';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { DayPicker, isClock, TimeField, useOwner } from '@/components/business/kit';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { toMinutes } from '@/lib/time';

/** When the salon is open. Masters' shifts are offered only inside these hours. */
export default function Hours() {
  const i18n = useI18n();
  const { business, busy, run } = useOwner();
  const [open, setOpen] = useState(business?.hours?.open ?? '10:00');
  const [close, setClose] = useState(business?.hours?.close ?? '20:00');
  const [closed, setClosed] = useState<number[]>(business?.closedDays ?? []);
  const [errors, setErrors] = useState<{ open?: StringKey; close?: StringKey }>({});

  const save = async () => {
    const e = {
      open: isClock(open) ? undefined : ('errClock' as const),
      close: !isClock(close)
        ? ('errClock' as const)
        : isClock(open) && toMinutes(close) <= toMinutes(open)
          ? ('errCloseAfterOpen' as const)
          : undefined,
    };
    setErrors(e);
    if (e.open || e.close) return;
    const ok = await run(
      (token) => businessApi.update(token, { hours: { open, close }, closedDays: closed }),
      i18n.t('savedToast'),
    );
    if (ok) router.back();
  };

  return (
    <AuthLayout
      title={i18n.t('hoursTitle')}
      subtitle={i18n.t('hoursSub')}
      footer={<Button label={i18n.t('save')} onPress={save} loading={busy} />}
    >
      <View style={styles.pair}>
        <View style={{ flex: 1 }}>
          <TimeField
            label={i18n.t('fOpens')}
            value={open}
            onChange={setOpen}
            error={errors.open ? i18n.t(errors.open) : null}
          />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField
            label={i18n.t('fCloses')}
            value={close}
            onChange={setClose}
            error={errors.close ? i18n.t(errors.close) : null}
          />
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text variant="captionStrong" tone="soft">
          {i18n.t('fClosedDays')}
        </Text>
        <DayPicker value={closed} onChange={setClosed} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: 12 },
});
