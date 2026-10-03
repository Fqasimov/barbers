import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

/** Same palette and type as the app (src/theme/tokens.ts). */
export const color = {
  paper: "#F3EFE8",
  surface: "#FBF9F5",
  ink: "#17140F",
  inkSoft: "#5C554B",
  inkMuted: "#6B645A",
  line: "#E1DBD0",
  accent: "#8A5A22",
  night: "#0E0D0B",
  brass: "#CFA772",
  brassDeep: "#9C7039",
  brassLight: "#EBCF9F",
  bone: "#F3EFE8",
};

export const font = {
  serif: "Newsreader",
  sans: "Geist",
  mono: "Geist Mono",
};

/** Emil Kowalski's curves — the same ones the app uses. */
export const ease = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  expo: Easing.bezier(0.16, 1, 0.3, 1),
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const faces: [string, string, string, "normal" | "italic"][] = [
  [font.serif, "Newsreader_300Light.ttf", "300", "normal"],
  [font.serif, "Newsreader_300Light_Italic.ttf", "300", "italic"],
  [font.serif, "Newsreader_400Regular.ttf", "400", "normal"],
  [font.serif, "Newsreader_400Regular_Italic.ttf", "400", "italic"],
  [font.sans, "Geist_400Regular.ttf", "400", "normal"],
  [font.sans, "Geist_500Medium.ttf", "500", "normal"],
  [font.mono, "GeistMono_400Regular.ttf", "400", "normal"],
  [font.mono, "GeistMono_500Medium.ttf", "500", "normal"],
];

export const fontsReady = Promise.all(
  faces.map(([family, file, weight, style]) =>
    loadFont({ family, url: staticFile(`fonts/${file}`), weight, style }),
  ),
);
