import { Redirect, useLocalSearchParams } from 'expo-router';

/** The salon's fixed wall QR (https://yazilnow.az/s/<id>): opens its page, never a review. */
export default function WallQr() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/salon/[id]', params: { id } }} />;
}
