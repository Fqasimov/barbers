import type { ImageSourcePropType } from 'react-native';

/**
 * Venue photos bundled with the app, keyed by salon id. Venues without one
 * fall back to a tonal placeholder. Add a photo: drop a JPEG into
 * assets/salons/ and register it here.
 */
export const salonPhotos: Partial<Record<string, ImageSourcePropType>> = {};
