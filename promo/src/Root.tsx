import React from "react";
import { Composition, Folder } from "remotion";

import { SalonAd, SALON_AD_FRAMES } from "./ad/SalonAd";
import { Opener, Outro, Promo, PROMO_FRAMES } from "./Promo";
import "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Promo" component={Promo} durationInFrames={PROMO_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="SalonAd" component={SalonAd} durationInFrames={SALON_AD_FRAMES} fps={30} width={1080} height={1920} />
      <Folder name="Scenes">
        <Composition id="Opener" component={Opener} durationInFrames={96} fps={30} width={1080} height={1920} />
        <Composition id="Outro" component={Outro} durationInFrames={120} fps={30} width={1080} height={1920} />
      </Folder>
    </>
  );
};
