import { Trash2, UserCog } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi } from '@/api/business';
import { hasFeature } from '@/auth/plans';
import { checkEmail } from '@/auth/validation';
import { FormField } from '@/components/auth/FormField';
import { Card, useOwner, useOwnerData } from '@/components/business/kit';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius, shadow } from '@/theme/tokens';

/**
 * The team, invited by email:
 *  - a master gets their own cabinet (every plan): check-in/out, schedule, bookings, their numbers
 *  - a manager runs the salon panel (Pro)
 */
export default function Team() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { business, run, busy } = useOwner();
  const { data, reload } = useOwnerData((t) => businessApi.team(t));
  const [email, setEmail] = useState('');
  const [where, setWhere] = useState<string | null>(null);
  const canManagers = hasFeature(business, 'managers');
  const [role, setRole] = useState<'staff' | 'manager'>('staff');
  const [masterId, setMasterId] = useState<string | null>(null);
  const masters = business?.masters ?? [];
  // Each master has one cabinet; those already linked aren't offered again.
  const linked = new Set((data ?? []).filter((m) => m.role === 'staff').map((m) => m.masterId));
  const free = masters.filter((m) => !linked.has(m.id));
  const [error, setError] = useState<string | null>(null);
  const locations = business?.locations?.filter((l) => l.role === 'owner') ?? [];
  const placeName = (id: string | null) => (id ? (locations.find((l) => l.id === id)?.name ?? '—') : i18n.t('teamAll'));

  const invite = async () => {
    const e = checkEmail(email);
    const noMaster = role === 'staff' && !masterId;
    setError(e ? i18n.t(e) : noMaster ? i18n.t('teamPickMaster') : null);
    if (e || noMaster) return;
    const row = await run(
      (t) =>
        businessApi.invite(
          t,
          role === 'staff'
            ? { email: email.trim(), role: 'staff', masterId }
            : { email: email.trim(), role: 'manager', branchId: where },
        ),
      i18n.t('teamInvited'),
    );
    if (row) {
      setEmail('');
      setMasterId(null);
      void reload();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('teamTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <Text variant="subhead" tone="soft">
          {i18n.t('teamSub')}
        </Text>
        {data && !data.length ? (
          <EmptyState icon={UserCog} title={i18n.t('teamEmpty')} body={i18n.t('teamSub')} />
        ) : null}
        {data?.length ? (
          <Card>
            {data.map((m, i) => (
              <View
                key={m.id}
                style={[
                  styles.row,
                  i < data.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{m.name || m.email}</Text>
                  <Text variant="caption" tone="soft" numberOfLines={1}>
                    {m.name ? `${m.email} · ` : ''}
                    {m.role === 'staff'
                      ? `${i18n.t('teamRoleStaff')}: ${masters.find((x) => x.id === m.masterId)?.name ?? '—'}`
                      : `${i18n.t('teamRoleManager')} · ${placeName(m.branchId)}`}
                    {m.accepted ? '' : ` · ${i18n.t('teamWaiting')}`}
                  </Text>
                </View>
                <PressableScale
                  onPress={async () => {
                    await run((t) => businessApi.removeMember(t, m.id));
                    void reload();
                  }}
                  accessibilityRole="button"
                  style={styles.icon}
                >
                  <Trash2 size={18} color={c.danger} strokeWidth={1.9} />
                </PressableScale>
              </View>
            ))}
          </Card>
        ) : null}
        <View style={[styles.form, { backgroundColor: c.surface }, shadow(c, 1)]}>
          <View style={{ gap: 8 }}>
            <Text variant="captionStrong" tone="soft">
              {i18n.t('teamRole')}
            </Text>
            <View style={styles.chips}>
              <Chip
                size="sm"
                label={i18n.t('teamRoleStaff')}
                selected={role === 'staff'}
                onPress={() => setRole('staff')}
              />
              {canManagers ? (
                <Chip
                  size="sm"
                  label={i18n.t('teamRoleManager')}
                  selected={role === 'manager'}
                  onPress={() => setRole('manager')}
                />
              ) : null}
            </View>
            <Text variant="caption" tone="muted">
              {i18n.t(role === 'staff' ? 'teamRoleStaffHint' : 'teamRoleManagerHint')}
            </Text>
          </View>
          {role === 'staff' ? (
            <View style={{ gap: 8 }}>
              <Text variant="captionStrong" tone="soft">
                {i18n.t('teamWhichMaster')}
              </Text>
              {free.length ? (
                <View style={styles.chips}>
                  {free.map((m) => (
                    <Chip
                      key={m.id}
                      size="sm"
                      label={m.name}
                      selected={masterId === m.id}
                      onPress={() => setMasterId(m.id)}
                    />
                  ))}
                </View>
              ) : (
                <Text variant="subhead" tone="soft">
                  {i18n.t(masters.length ? 'teamAllLinked' : 'teamAddMastersFirst')}
                </Text>
              )}
            </View>
          ) : null}
          <FormField
            label={i18n.t('teamEmail')}
            placeholder={i18n.t('phTeamEmail')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={error}
          />
          {role === 'manager' && locations.length > 1 ? (
            <View style={{ gap: 8 }}>
              <Text variant="captionStrong" tone="soft">
                {i18n.t('teamWhere')}
              </Text>
              <View style={styles.chips}>
                <Chip size="sm" label={i18n.t('teamAll')} selected={!where} onPress={() => setWhere(null)} />
                {locations.map((l) => (
                  <Chip key={l.id} size="sm" label={l.name} selected={where === l.id} onPress={() => setWhere(l.id)} />
                ))}
              </View>
            </View>
          ) : null}
          <Button label={i18n.t('teamInvite')} onPress={invite} loading={busy} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  form: { borderRadius: radius.lg, padding: 16, gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
