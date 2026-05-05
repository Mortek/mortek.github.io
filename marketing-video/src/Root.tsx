import { Composition } from "remotion";
import { MarketingVideo } from "./MarketingVideo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MarketingVideo"
        component={MarketingVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MarketingVideoShorts"
        component={MarketingVideo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
