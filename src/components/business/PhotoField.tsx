import { Image } from 'expo-image';
import { ImagePlus, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { pickSquarePhoto } from '@/lib/pickPhoto';
import { useTheme } from '@/theme/ThemeProvider';
import { isSite, radius } from '@/theme/tokens';

/**
 * A single picture with a preview: the salon's logo or a master's portrait.
 * `onPick` uploads the prepared JPEG; `onRemove` deletes it.
 */
export function PhotoField({
  label,
  hint,
  url,
  placeholderIcon,
  round = false,
  onPick,
  onRemove,
}: {
  label: string;
  hint?: string;
  url: string | null | undefined;
  placeholderIcon: LucideIcon;
  round?: boolean;
  onPick: (uri: string) => Promise<unknown>;
  onRemove?: () => Promise<unknown>;
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  const [busy, setBusy] = useState(false);
  const Icon = placeholderIcon;
  const shape = { borderRadius: round ? 48 : isSite ? radius.sm : radius.lg };

  const pick = async () => {
    const uri = await pickSquarePhoto();
    if (uri === 'denied') return toast(i18n.t('photosPermission'), 'info');
    if (!uri) return;
    setBusy(true);
    try {
      await onPick(uri);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Text variant="captionStrong" tone="soft">
        {label}
      </Text>
      <View style={styles.row}>
        <View style={[styles.preview, shape, { backgroundColor: c.sunken, borderColor: c.line }]}>
          {url ? (
            <Image source={{ uri: url }} style={[StyleSheet.absoluteFill, shape]} contentFit="cover" />
          ) : (
            <Icon size={30} color={c.inkMuted} strokeWidth={1.6} />
          )}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Button
            label={url ? i18n.t('photoChange') : i18n.t('photoUpload')}
            icon={ImagePlus}
            variant="secondary"
            size="sm"
            onPress={pick}
            loading={busy}
          />
          {url && onRemove ? (
            <Button label={i18n.t('photoRemove')} variant="ghost" size="sm" onPress={() => void onRemove()} />
          ) : null}
        </View>
      </View>
      {hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  preview: {
    width: 96,
    height: 96,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
