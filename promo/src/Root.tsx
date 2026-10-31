import React from "react";
import { Composition, Folder } from "remotion";

import { SalonAd, SALON_AD_FRAMES } from "./ad/SalonAd";
import { SignupPhone, SIGNUP_PHONE_FRAMES } from "./ad/SignupPhone";
import { TrialPhone, TRIAL_PHONE_FRAMES } from "./ad/TrialPhone";
import { TrialShort, TRIAL_SHORT_FRAMES } from "./ad/TrialShort";
import { TrialShortVertical, TRIAL_SHORT_VERTICAL_FRAMES } from "./ad/TrialShortVertical";
import { TrialShortWide, TRIAL_SHORT_WIDE_FRAMES } from "./ad/TrialShortWide";
import { Opener, Outro, Promo, PROMO_FRAMES } from "./Promo";
import "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Promo" component={Promo} durationInFrames={PROMO_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="SalonAd" component={SalonAd} durationInFrames={SALON_AD_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="SignupPhone" component={SignupPhone} durationInFrames={SIGNUP_PHONE_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="TrialPhone" component={TrialPhone} durationInFrames={TRIAL_PHONE_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="TrialShort" component={TrialShort} durationInFrames={TRIAL_SHORT_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="TrialShortWide" component={TrialShortWide} durationInFrames={TRIAL_SHORT_WIDE_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="TrialShortVertical" component={TrialShortVertical} durationInFrames={TRIAL_SHORT_VERTICAL_FRAMES} fps={30} width={1080} height={1920} />
      <Folder name="Scenes">
        <Composition id="Opener" component={Opener} durationInFrames={96} fps={30} width={1080} height={1920} />
        <Composition id="Outro" component={Outro} durationInFrames={120} fps={30} width={1080} height={1920} />
      </Folder>
    </>
  );
};
