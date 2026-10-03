import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';

import { fmtRating } from '@/lib/format';
import { boundsOf } from '@/lib/geo';
import { useTheme } from '@/theme/ThemeProvider';

import { RatingPin } from './RatingPin';
import type { MapCanvasProps } from './types';

/** Muted Google style for Android — warm land, quiet labels, no POI noise. */
const lightStyle = [
  { elementType: 'geometry', stylers: [{ color: '#efeae1' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a7266' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f3efe8' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fbf9f5' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e6ddcd' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfd6d3' }] },
];
const darkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1816' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8276' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e0d0b' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2622' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3530' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1416' }] },
];

function OriginDot() {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: c.raised,
        backgroundColor: c.accent,
      }}
    />
  );
}

export function MapCanvas({ items, activeId, origin, showsUser, onSelect, insets }: MapCanvasProps) {
  const { scheme } = useTheme();
  const ref = useRef<MapView>(null);
  // Custom marker views are rasterised: track changes briefly after each update, then freeze.
  const signature = `${activeId}|${items.map((i) => i.salon.id).join(',')}`;
  const [settled, setSettled] = useState<string | null>(null);
  const tracking = settled !== signature;
  useEffect(() => {
    if (!tracking) return;
    const t = setTimeout(() => setSettled(signature), 700);
    return () => clearTimeout(t);
  }, [signature, tracking]);

  const initialRegion = useMemo<Region>(() => {
    const b = boundsOf([origin, ...items.map((i) => i.salon.coords)]);
    return {
      latitude: (b.minLat + b.maxLat) / 2,
      longitude: (b.minLon + b.maxLon) / 2,
      latitudeDelta: Math.max(0.03, (b.maxLat - b.minLat) * 1.6),
      longitudeDelta: Math.max(0.03, (b.maxLon - b.minLon) * 1.3),
    };
    // Only the first frame needs this; later moves animate.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const active = items.find((i) => i.salon.id === activeId);
    if (!active) return;
    ref.current?.animateCamera({ center: active.salon.coords }, { duration: 450 });
  }, [activeId, items]);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_DEFAULT}
      initialRegion={initialRegion}
      mapPadding={{ top: insets.top, bottom: insets.bottom, left: 0, right: 0 }}
      showsUserLocation={showsUser}
      showsMyLocationButton={false}
      showsCompass={false}
      showsPointsOfInterests={false}
      toolbarEnabled={false}
      userInterfaceStyle={scheme}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      customMapStyle={Platform.OS === 'android' ? (scheme === 'dark' ? darkStyle : lightStyle) : undefined}
    >
      {!showsUser ? (
        <Marker
          coordinate={origin}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={tracking}
          accessibilityLabel="Search centre"
        >
          <OriginDot />
        </Marker>
      ) : null}
      {items.map((item, i) => {
        const active = item.salon.id === activeId;
        return (
          <Marker
            key={item.salon.id}
            identifier={item.salon.id}
            coordinate={item.salon.coords}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={active ? 10 : 1}
            tracksViewChanges={tracking}
            onPress={() => onSelect(item.salon.id)}
            accessibilityLabel={`${item.salon.name}, rated ${fmtRating(item.live.rating)}`}
          >
            <RatingPin rating={item.live.rating} active={active} best={i === 0} />
          </Marker>
        );
      })}
    </MapView>
  );
}
