import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { businessApi } from '@/api/business';
import { checkRequired } from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { locFrom, useOwner } from '@/components/business/kit';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { categories } from '@/data/categories';
import { categoryIcon } from '@/data/icons';
import type { CategoryId } from '@/data/types';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';

/** Add or edit one service: name, category, duration and price. */
export default function ServiceForm() {
  const i18n = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { business, busy, run } = useOwner();
  const existing = business?.services?.find((s) => s.id === id);
  const allowed = business?.categories?.length ? business.categories : categories.map((c) => c.id);

  const [name, setName] = useState(existing ? i18n.tx(existing.name) : '');
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? allowed[0]);
  const [duration, setDuration] = useState(existing ? String(existing.durationMin) : '');
  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [description, setDescription] = useState(existing?.description ? i18n.tx(existing.description) : '');
  const [errors, setErrors] = useState<Partial<Record<'name' | 'duration' | 'price', StringKey>>>({});

  const save = async () => {
    const minutes = Number(duration);
    const amount = Number(price.replace(',', '.'));
    const e = {
      name: checkRequired(name) ?? undefined,
      duration: Number.isInteger(minutes) && minutes >= 5 && minutes <= 480 ? undefined : ('errDuration' as const),
      price: price.trim() && Number.isFinite(amount) && amount >= 0 && amount <= 10000 ? undefined : ('errPrice' as const),
    };
    setErrors(e);
    if (e.name || e.duration || e.price) return;
    const input = {
      name: locFrom(name, existing?.name),
      category,
      durationMin: minutes,
      price: Math.round(amount),
      description: description.trim() ? locFrom(description, existing?.description) : null,
    };
    const ok = await run(
      (token) => (existing ? businessApi.updateService(token, existing.id, input) : businessApi.addService(token, input)),
      i18n.t('savedToast'),
    );
    if (ok !== undefined) router.back();
  };

  const remove = () => {
    if (!existing) return;
    const go = async () => {
      await run((token) => businessApi.deleteService(token, existing.id).then(() => true));
      router.back();
    };
    if (Platform.OS === 'web') return void go();
    Alert.alert(i18n.t('svcDeleteTitle'), i18n.tx(existing.name), [
      { text: i18n.t('keep'), style: 'cancel' },
      { text: i18n.t('delete'), style: 'destructive', onPress: () => void go() },
    ]);
  };

  const err = (k: keyof typeof errors) => (errors[k] ? i18n.t(errors[k]!) : null);
  return (
    <AuthLayout
      title={existing ? i18n.t('svcEdit') : i18n.t('svcNew')}
      footer={
        <>
          <Button label={i18n.t('save')} onPress={save} loading={busy} />
          {existing ? <Button label={i18n.t('delete')} variant="dangerGhost" size="md" onPress={remove} /> : null}
        </>
      }
    >
      <FormField
        label={i18n.t('fServiceName')}
        placeholder={i18n.t('phServiceName')}
        value={name}
        onChangeText={setName}
        error={err('name')}
        autoCapitalize="sentences"
        maxLength={80}
      />
      <View style={{ gap: 8 }}>
        <Text variant="captionStrong" tone="soft">
          {i18n.t('fCategory')}
        </Text>
        <View style={styles.chips}>
          {allowed.map((cid) => {
            const cat = categories.find((c) => c.id === cid)!;
            return (
              <Chip
                key={cid}
                size="sm"
                icon={categoryIcon[cid]}
                label={i18n.tx(cat.label)}
                selected={category === cid}
                onPress={() => setCategory(cid)}
              />
            );
          })}
        </View>
      </View>
      <View style={styles.pair}>
        <View style={{ flex: 1 }}>
          <FormField
            label={i18n.t('fDuration')}
            placeholder={i18n.t('phDuration')}
            value={duration}
            onChangeText={(v) => setDuration(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            error={err('duration')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FormField
            label={i18n.t('fPrice')}
            placeholder={i18n.t('phPrice')}
            value={price}
            onChangeText={(v) => setPrice(v.replace(/[^\d.,]/g, ''))}
            keyboardType="decimal-pad"
            maxLength={6}
            error={err('price')}
          />
        </View>
      </View>
      <FormField
        label={i18n.t('fDescription')}
        placeholder={i18n.t('phDescription')}
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={300}
        autoCapitalize="sentences"
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pair: { flexDirection: 'row', gap: 12 },
});
