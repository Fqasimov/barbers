import * as Location from 'expo-location';
import { router } from 'expo-router';
import { LocateFixed, MapPinCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { businessApi } from '@/api/business';
import type { Audience } from '@/auth/types';
import { useSession } from '@/auth/useSession';
import { checkPhone, checkRequired, formatPhone, phoneDigits, toE164 } from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Choice } from '@/components/auth/Choice';
import { FormField } from '@/components/auth/FormField';
import { locFrom, useOwner } from '@/components/business/kit';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { categories } from '@/data/categories';
import { categoryIcon } from '@/data/icons';
import type { CategoryId, Coords } from '@/data/types';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { useTheme } from '@/theme/ThemeProvider';

type Errors = Partial<Record<'salonName' | 'district' | 'address' | 'phone' | 'whatsapp' | 'categories', StringKey>>;

/** The public details clients see on the salon's page. */
export default function SalonDetails() {
  const { c } = useTheme();
  const i18n = useI18n();
  const { business, busy, run } = useOwner();
  const ownerPhone = useSession((s) => s.session?.user.phone ?? '');
  const [salonName, setSalonName] = useState(business?.salonName ?? '');
  const [cats, setCats] = useState<CategoryId[]>(business?.categories ?? []);
  const [audience, setAudience] = useState<Audience>(business?.audience ?? 'all');
  const [district, setDistrict] = useState(business?.district ?? '');
  const [address, setAddress] = useState(business?.address ?? '');
  const [phone, setPhone] = useState(formatPhone(business?.phone || ownerPhone));
  const [whatsapp, setWhatsapp] = useState(business?.whatsapp ? formatPhone(business.whatsapp) : '');
  const [about, setAbout] = useState(business?.about ? i18n.tx(business.about) : '');
  const [coords, setCoords] = useState<Coords | null>(business?.coords ?? null);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const locate = async () => {
    setLocating(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return toast(i18n.t('locationDenied'), 'info');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      toast(i18n.t('locationDenied'), 'info');
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    const e: Errors = {
      salonName: checkRequired(salonName) ?? undefined,
      district: checkRequired(district) ?? undefined,
      address: checkRequired(address) ?? undefined,
      phone: phone ? (checkPhone(phone) ?? undefined) : undefined,
      whatsapp: whatsapp ? (checkPhone(whatsapp) ?? undefined) : undefined,
      categories: cats.length ? undefined : 'errCategories',
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    const ok = await run(
      (token) =>
        businessApi.update(token, {
          salonName: salonName.trim(),
          categories: cats,
          audience,
          district: district.trim(),
          address: address.trim(),
          phone: phone ? toE164(phone) : '',
          whatsapp: whatsapp ? `994${phoneDigits(whatsapp)}` : '',
          about: about.trim() ? locFrom(about, business?.about) : null,
          coords,
        }),
      i18n.t('savedToast'),
    );
    if (ok) router.back();
  };

  const err = (k: keyof Errors) => (errors[k] ? i18n.t(errors[k]!) : null);
  return (
    <AuthLayout
      title={i18n.t('detailsTitle')}
      footer={<Button label={i18n.t('save')} onPress={save} loading={busy} />}
    >
      <FormField
        label={i18n.t('fSalonName')}
        placeholder={i18n.t('phSalonName')}
        value={salonName}
        onChangeText={setSalonName}
        error={err('salonName')}
        autoCapitalize="words"
      />
      <View style={{ gap: 8 }}>
        <Text variant="captionStrong" tone="soft">
          {i18n.t('fCategories')}
        </Text>
        <View style={styles.chips}>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              size="sm"
              icon={categoryIcon[cat.id]}
              label={i18n.tx(cat.label)}
              selected={cats.includes(cat.id)}
              onPress={() => setCats(cats.includes(cat.id) ? cats.filter((x) => x !== cat.id) : [...cats, cat.id])}
            />
          ))}
        </View>
        {err('categories') ? (
          <Text variant="caption" tone="danger">
            {err('categories')}
          </Text>
        ) : null}
      </View>
      <Choice<Audience>
        label={i18n.t('fAudience')}
        options={[
          { value: 'all', label: i18n.t('audAll') },
          { value: 'women', label: i18n.t('audWomen') },
          { value: 'men', label: i18n.t('audMen') },
        ]}
        value={audience}
        onChange={setAudience}
      />
      <FormField
        label={i18n.t('fDistrict')}
        placeholder={i18n.t('phDistrict')}
        value={district}
        onChangeText={setDistrict}
        error={err('district')}
        autoCapitalize="words"
      />
      <FormField
        label={i18n.t('fAddress')}
        placeholder={i18n.t('phAddress')}
        value={address}
        onChangeText={setAddress}
        error={err('address')}
        autoComplete="street-address"
      />
      <View style={[styles.locate, { backgroundColor: c.surface, borderColor: c.line }]}>
        {coords ? (
          <MapPinCheck size={18} color={c.success} strokeWidth={2} />
        ) : (
          <LocateFixed size={18} color={c.inkSoft} strokeWidth={2} />
        )}
        <Text variant="subhead" style={{ flex: 1 }}>
          {coords ? i18n.t('locationSet') : i18n.t('locationHint')}
        </Text>
        <Button label={i18n.t('useMyLocation')} size="sm" variant="secondary" onPress={locate} loading={locating} />
      </View>
      <FormField
        label={i18n.t('fPhone')}
        placeholder={i18n.t('phPhone')}
        prefix="+994"
        value={phone}
        onChangeText={(v) => setPhone(formatPhone(v))}
        keyboardType="phone-pad"
        error={err('phone')}
      />
      <FormField
        label={i18n.t('fWhatsapp')}
        placeholder={i18n.t('phPhone')}
        prefix="+994"
        value={whatsapp}
        onChangeText={(v) => setWhatsapp(formatPhone(v))}
        keyboardType="phone-pad"
        error={err('whatsapp')}
      />
      <FormField
        label={i18n.t('fAbout')}
        placeholder={i18n.t('phAbout')}
        value={about}
        onChangeText={setAbout}
        multiline
        maxLength={600}
        autoCapitalize="sentences"
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locate: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
});
