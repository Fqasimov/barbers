import { Building2, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi } from '@/api/business';
import { setBranch } from '@/api/client';
import { checkRequired } from '@/auth/validation';
import { FormField } from '@/components/auth/FormField';
import { Card, useOwner, useOwnerData } from '@/components/business/kit';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { canBuyInApp } from '@/lib/billing';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius, shadow } from '@/theme/tokens';
import { router } from 'expo-router';

const confirm = (title: string, body: string, ok: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(window.confirm(`${title}\n\n${body}`))
    : new Promise<boolean>((resolve) =>
        Alert.alert(title, body, [
          { text: '×', style: 'cancel', onPress: () => resolve(false) },
          { text: ok, style: 'destructive', onPress: () => resolve(true) },
        ]),
      );

/** Pro: the account's locations. Three are in the price; each further one adds a monthly fee. */
export default function Branches() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { run, busy, refresh } = useOwner();
  const { data, reload } = useOwnerData((t) => businessApi.branches(t));
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const add = async () => {
    const e = {
      name: checkRequired(name) ? i18n.t(checkRequired(name)!) : null,
      district: checkRequired(district) ? i18n.t(checkRequired(district)!) : null,
      address: checkRequired(address) ? i18n.t(checkRequired(address)!) : null,
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    const row = await run(
      (t) => businessApi.addBranch(t, { salonName: name.trim(), district: district.trim(), address: address.trim() }),
      i18n.t('branchAdded'),
    );
    if (row) {
      setAdding(false);
      setName('');
      setDistrict('');
      setAddress('');
      void reload();
    }
  };

  const remove = async (id: string, label: string) => {
    if (!(await confirm(`${i18n.t('branchRemove')}: ${label}`, i18n.t('branchRemoveBody'), i18n.t('branchRemove'))))
      return;
    await run((t) => businessApi.deleteBranch(t, id));
    void reload();
  };

  const open = (id: string, isMain: boolean) => {
    setBranch(isMain ? null : id);
    void refresh().then(() => router.dismissTo('/business'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('branchesTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        {data ? (
          <>
            <Text variant="subhead" tone="soft">
              {i18n.t('branchesSub', { included: data.included, price: i18n.price(data.extraPrice) })}
            </Text>
            {canBuyInApp && data.price ? (
              <Text variant="headline">{i18n.t('branchesPrice', { price: i18n.price(data.price) })}</Text>
            ) : null}
            <Card>
              {data.data.map((b, i) => (
                <View
                  key={b.id}
                  style={[
                    styles.row,
                    i < data.data.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
                  ]}
                >
                  <PressableScale onPress={() => open(b.id, b.isMain)} accessibilityRole="button" style={styles.main}>
                    <Building2 size={20} color={c.inkSoft} strokeWidth={1.9} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{b.name}</Text>
                      <Text variant="caption" tone="soft" numberOfLines={1}>
                        {b.isMain ? `${i18n.t('mainSalon')} · ` : ''}
                        {b.district} · {i18n.n(b.masters, 'master')}
                      </Text>
                    </View>
                  </PressableScale>
                  {!b.isMain ? (
                    <PressableScale
                      onPress={() => remove(b.id, b.name)}
                      accessibilityRole="button"
                      accessibilityLabel={i18n.t('branchRemove')}
                      style={styles.icon}
                    >
                      <Trash2 size={18} color={c.danger} strokeWidth={1.9} />
                    </PressableScale>
                  ) : null}
                </View>
              ))}
            </Card>
          </>
        ) : null}
        {adding ? (
          <View style={[styles.form, { backgroundColor: c.surface }, shadow(c, 1)]}>
            <FormField
              label={i18n.t('branchName')}
              placeholder={i18n.t('phSalonName')}
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />
            <FormField
              label={i18n.t('fDistrict')}
              placeholder={i18n.t('phDistrict')}
              value={district}
              onChangeText={setDistrict}
              error={errors.district}
              autoCapitalize="words"
            />
            <FormField
              label={i18n.t('fAddress')}
              placeholder={i18n.t('phAddress')}
              value={address}
              onChangeText={setAddress}
              error={errors.address}
            />
            <Button label={i18n.t('branchAdd')} onPress={add} loading={busy} />
          </View>
        ) : (
          <Button label={i18n.t('branchAdd')} icon={Plus} variant="secondary" onPress={() => setAdding(true)} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  form: { borderRadius: radius.lg, padding: 16, gap: 12 },
});
