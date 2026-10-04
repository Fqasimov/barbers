import { Linking, Platform, Share } from 'react-native';

import type { Salon } from '@/data/types';

export function openDirections(salon: Salon) {
  const { latitude, longitude } = salon.coords;
  const label = encodeURIComponent(salon.name);
  const web = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const url = Platform.select({
    ios: `maps://?daddr=${latitude},${longitude}&q=${label}`,
    android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    default: web,
  });
  Linking.openURL(url).catch(() => Linking.openURL(web));
}

export function callSalon(salon: Salon) {
  Linking.openURL(`tel:${salon.phone.replace(/\s/g, '')}`).catch(() => {});
}

/** Opens the salon's WhatsApp chat, optionally with a prefilled message. */
export function messageSalon(salon: Salon, text?: string) {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  Linking.openURL(`https://wa.me/${salon.whatsapp}${q}`).catch(() => {});
}

export function shareSalon(salon: Salon, line: string) {
  Share.share({ message: `${salon.name} — ${line} ${salon.address}, ${salon.district}, Bakı.` }).catch(() => {});
}
