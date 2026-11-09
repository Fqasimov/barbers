import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/**
 * One photo from the library, cropped square by the picker, resized to `edge` px and
 * re-encoded as JPEG (which drops GPS and other metadata). null when cancelled;
 * 'denied' without permission.
 */
export async function pickSquarePhoto(edge = 800): Promise<string | null | 'denied'> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return 'denied';
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    exif: false,
  });
  if (picked.canceled || !picked.assets[0]) return null;
  const asset = picked.assets[0];
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > edge) {
    ctx.resize(asset.width >= asset.height ? { width: edge } : { height: edge });
  }
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  return saved.uri;
}
