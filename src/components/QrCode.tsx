import qrcode from 'qrcode-generator';
import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/** A QR code drawn with SVG (pure JS encoder, no native module). Always dark on white, as scanners expect. */
export function QrCode({ value, size = 240 }: { value: string; size?: number }) {
  const { path, n } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let d = '';
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) if (qr.isDark(y, x)) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    }
    return { path: d, n: count + 8 };
  }, [value]);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} accessibilityRole="image" accessibilityLabel={value}>
      <Rect width={n} height={n} fill="#FFFFFF" />
      <Path d={path} fill="#141210" />
    </Svg>
  );
}
