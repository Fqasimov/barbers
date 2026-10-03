import React from "react";
import { Composition, Folder } from "remotion";

import { Promo, PROMO_FRAMES } from "./Promo";
import { Feature } from "./scenes/Feature";
import { Headline } from "./scenes/Headline";
import { Opener, OPENER_FRAMES } from "./scenes/Opener";
import { Outro } from "./scenes/Outro";
import "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Promo" component={Promo} durationInFrames={PROMO_FRAMES} fps={30} width={1080} height={1920} />
      <Folder name="Scenes">
        <Composition id="Opener" component={Opener} durationInFrames={OPENER_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Headline" component={Headline} durationInFrames={96} fps={30} width={1080} height={1920} />
        <Composition
          id="Feature"
          component={Feature}
          durationInFrames={86}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            index: "01",
            overline: "Choose your master",
            title: "Every master’s",
            italic: "next free minute.",
            screen: "master.png",
          }}
        />
        <Composition id="Outro" component={Outro} durationInFrames={108} fps={30} width={1080} height={1920} />
      </Folder>
    </>
  );
};
