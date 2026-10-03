import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";

import { Feature } from "./scenes/Feature";
import { Headline } from "./scenes/Headline";
import { Opener, OPENER_FRAMES } from "./scenes/Opener";
import { Outro } from "./scenes/Outro";
import { color, ease } from "./theme";

/** The story starts underneath the opener, so the cut reveals it. */
const STORY_FROM = 72;
const T = 16;
export const STORY_FRAMES = 96 + 4 * 86 + 108 - 5 * T;
export const PROMO_FRAMES = STORY_FROM + STORY_FRAMES;

const push = () => slide({ direction: "from-right" });
const timing = () => linearTiming({ durationInFrames: T, easing: ease.inOut });

export const Promo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: color.paper }}>
      <Sequence name="Story" from={STORY_FROM} premountFor={fps}>
        <TransitionSeries>
          <TransitionSeries.Sequence name="Headline" durationInFrames={96} premountFor={fps}>
            <Headline />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing()} />
          <TransitionSeries.Sequence name="Masters" durationInFrames={86} premountFor={fps}>
            <Feature index="01" overline="Choose your master" title="Every master’s" italic="next free minute." screen="master.png" />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={push()} timing={timing()} />
          <TransitionSeries.Sequence name="Time" durationInFrames={86} premountFor={fps}>
            <Feature index="02" overline="A week ahead" title="Pick a day." italic="Pick a time." screen="time.png" />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={push()} timing={timing()} />
          <TransitionSeries.Sequence name="Map" durationInFrames={86} premountFor={fps}>
            <Feature index="03" overline="Map · price range" title="The best near you," italic="in your budget." screen="map.png" />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={push()} timing={timing()} />
          <TransitionSeries.Sequence name="Top rated" durationInFrames={86} premountFor={fps}>
            <Feature index="04" overline="Top rated" title="Ranked by" italic="real visits." screen="top.png" />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing()} />
          <TransitionSeries.Sequence name="Outro" durationInFrames={108} premountFor={fps}>
            <Outro />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </Sequence>

      <Sequence name="Opener" durationInFrames={OPENER_FRAMES} premountFor={fps}>
        <Opener />
      </Sequence>
    </AbsoluteFill>
  );
};
