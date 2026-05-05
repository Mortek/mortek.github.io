import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import type { BookData } from "./types";
import { Hook } from "./scenes/Hook";
import { Cover } from "./scenes/Cover";
import { Pillars } from "./scenes/Pillars";
import { CTA } from "./scenes/CTA";

const HOOK_DUR = 75;
const COVER_DUR = 150;
const PILLARS_DUR = 165;
const CTA_DUR = 150;

export const BOOK_SHORT_DURATION = HOOK_DUR + COVER_DUR + PILLARS_DUR + CTA_DUR;

export const BookShort: React.FC<{ book: BookData }> = ({ book }) => {
  const { durationInFrames } = useVideoConfig();

  const audioVolume = (f: number) => {
    const fadeIn = interpolate(f, [0, 30], [0, 1], { extrapolateRight: "clamp" });
    const fadeOut = interpolate(
      f,
      [durationInFrames - 45, durationInFrames - 5],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    return Math.min(fadeIn, fadeOut);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: book.palette.bg }}>
      <Audio src={staticFile("audio/ambient-calm.mp3")} volume={audioVolume} />

      <Sequence from={0} durationInFrames={HOOK_DUR}>
        <Hook book={book} durationInFrames={HOOK_DUR} />
      </Sequence>

      <Sequence from={HOOK_DUR} durationInFrames={COVER_DUR}>
        <Cover book={book} durationInFrames={COVER_DUR} />
      </Sequence>

      <Sequence from={HOOK_DUR + COVER_DUR} durationInFrames={PILLARS_DUR}>
        <Pillars book={book} durationInFrames={PILLARS_DUR} />
      </Sequence>

      <Sequence from={HOOK_DUR + COVER_DUR + PILLARS_DUR} durationInFrames={CTA_DUR}>
        <CTA book={book} durationInFrames={CTA_DUR} />
      </Sequence>
    </AbsoluteFill>
  );
};
