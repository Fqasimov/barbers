import { Linking, Platform, Share } from 'react-native';

import type { Salon } from '@/data/types';

export function openDirections(salon: Salon) {
  const { latitude, longitude } = salon.coords;
  const label = encodeURIComponent(salon.name);
  const url = Platform.select({
    ios: `maps://?daddr=${latitude},${longitude}&q=${label}`,
    android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
  });
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`),
  );
}

export function callSalon(salon: Salon) {
  Linking.openURL(`tel:${salon.phone.replace(/\s/g, '')}`).catch(() => {});
}

export function shareSalon(salon: Salon) {
  Share.share({ message: `${salon.name} — ${salon.tagline} ${salon.address}, ${salon.district}, Baku.` }).catch(
    () => {},
  );
}
