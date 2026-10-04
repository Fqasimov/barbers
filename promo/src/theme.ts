import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

/** Same palette and type as the app (src/theme/tokens.ts). */
export const color = {
  linen: "#F3EFE8",
  surface: "#FFFFFF",
  sunken: "#EAE5DC",
  ink: "#141210",
  inkSoft: "#5B554C",
  inkMuted: "#6A6359",
  line: "#E3DDD3",
  nar: "#B4233C",
  shadow: "#2A2015",
};

export const font = "Onest";

/** Emil Kowalski's curves — the same ones the app uses. */
export const ease = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  /** iOS sheet / push curve. */
  ios: Easing.bezier(0.32, 0.72, 0, 1),
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const faces: [string, string][] = [
  ["Onest_400Regular.ttf", "400"],
  ["Onest_500Medium.ttf", "500"],
  ["Onest_600SemiBold.ttf", "600"],
  ["Onest_700Bold.ttf", "700"],
];

export const fontsReady = Promise.all(
  faces.map(([file, weight]) => loadFont({ family: font, url: staticFile(`fonts/${file}`), weight })),
);
