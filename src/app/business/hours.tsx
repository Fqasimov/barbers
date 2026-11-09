import { router } from 'expo-router';
import { useState } from 'react';

import { businessApi } from '@/api/business';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useOwner } from '@/components/business/kit';
import { checkWeek, WeekEditor, type WeekErrors, type WeekSpans } from '@/components/business/WeekEditor';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/i18n';
import { salonWeek } from '@/lib/week';

/** When the salon is open, day by day. Masters' shifts are offered only inside these hours. */
export default function Hours() {
  const i18n = useI18n();
  const { business, busy, run } = useOwner();
  const [week, setWeek] = useState<WeekSpans>(() =>
    salonWeek(business ?? {}).map((d) => (d ? { from: d.open, to: d.close } : null)),
  );
  const [errors, setErrors] = useState<WeekErrors>({});

  const save = async () => {
    const e = checkWeek(week);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (week.every((d) => d === null)) return toast(i18n.t('errPickDays'), 'info');
    const ok = await run(
      (token) => businessApi.update(token, { hoursWeek: week.map((d) => (d ? { open: d.from, close: d.to } : null)) }),
      i18n.t('savedToast'),
    );
    if (ok) router.back();
  };

  return (
    <AuthLayout
      title={i18n.t('hoursTitle')}
      subtitle={i18n.t('hoursWeekSub')}
      footer={<Button label={i18n.t('save')} onPress={save} loading={busy} />}
    >
      <WeekEditor
        value={week}
        onChange={setWeek}
        errors={errors}
        fromLabel={i18n.t('fOpens')}
        toLabel={i18n.t('fCloses')}
        onLabel={i18n.t('dayOpen')}
        offLabel={i18n.t('dayClosed')}
        fallback={{ from: business?.hours?.open ?? '10:00', to: business?.hours?.close ?? '20:00' }}
      />
    </AuthLayout>
  );
}
