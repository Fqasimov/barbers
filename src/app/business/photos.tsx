import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi } from '@/api/business';
import { useOwner } from '@/components/business/kit';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius } from '@/theme/tokens';

const MAX_PHOTOS = 12;
const MAX_EDGE = 1600;

/** Resizes to 1600 px on the long edge and re-encodes as JPEG, which also drops GPS and other metadata. */
async function prepare(asset: ImagePicker.ImagePickerAsset) {
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_EDGE) {
    ctx.resize(asset.width >= asset.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
  return saved.uri;
}

export default function Photos() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { business, run } = useOwner();
  const [uploading, setUploading] = useState(false);
  const photos = business?.photos ?? [];
  const size = (Math.min(width, 600) - gutter * 2 - 10) / 2;

  const add = async () => {
    if (photos.length >= MAX_PHOTOS) return toast(i18n.t('photosLimit'), 'info');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast(i18n.t('photosPermission'), 'info');
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 1,
      exif: false,
    });
    if (picked.canceled) return;
    setUploading(true);
    try {
      for (const asset of picked.assets) {
        const uri = await prepare(asset);
        await run((token) => businessApi.uploadPhoto(token, uri));
      }
    } catch {
      toast(i18n.t('errUnknown'), 'info');
    } finally {
      setUploading(false);
    }
  };

  const remove = (id: string) => {
    const go = () => void run((token) => businessApi.deletePhoto(token, id).then(() => true));
    if (Platform.OS === 'web') return go();
    Alert.alert(i18n.t('photoDeleteTitle'), undefined, [
      { text: i18n.t('keep'), style: 'cancel' },
      { text: i18n.t('delete'), style: 'destructive', onPress: go },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('photosTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <Text variant="subhead" tone="soft">
          {i18n.t('photosSub')}
        </Text>
        {photos.length ? (
          <View style={styles.grid}>
            {photos.map((p) => (
              <View key={p.id} style={{ width: size, height: size * 0.75 }}>
                <Image source={{ uri: p.url }} style={[styles.photo, { backgroundColor: c.sunken }]} contentFit="cover" />
                <PressableScale
                  onPress={() => remove(p.id)}
                  hitSlop={8}
                  accessibilityLabel={i18n.t('delete')}
                  style={[styles.remove, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
                >
                  <X size={14} color="#fff" strokeWidth={2.6} />
                </PressableScale>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState icon={Camera} title={i18n.t('photosEmpty')} body={i18n.t('photosSub')} />
        )}
        <Button
          label={i18n.t('photosAdd')}
          icon={ImagePlus}
          variant="secondary"
          onPress={add}
          loading={uploading}
          disabled={photos.length >= MAX_PHOTOS}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: '100%', height: '100%', borderRadius: radius.md },
  remove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
