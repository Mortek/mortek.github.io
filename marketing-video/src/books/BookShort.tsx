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

const HOOK_START = 0;
const COVER_START = HOOK_DUR;
const PILLARS_START = HOOK_DUR + COVER_DUR;
const CTA_START = HOOK_DUR + COVER_DUR + PILLARS_DUR;

export const BOOK_SHORT_DURATION = HOOK_DUR + COVER_DUR + PILLARS_DUR + CTA_DUR;

const MUSIC_BASE = 0.18;
const MUSIC_DUCKED = 0.09;
const VOICE_GAIN = 1.0;

const VOICE_WINDOWS: Array<[number, number]> = [
  [HOOK_START + 4, HOOK_START + HOOK_DUR],
  [COVER_START + 6, COVER_START + COVER_DUR],
  [PILLARS_START + 6, PILLARS_START + PILLARS_DUR],
  [CTA_START + 6, CTA_START + CTA_DUR],
];

const isInVoiceWindow = (frame: number) =>
  VOICE_WINDOWS.some(([a, b]) => frame >= a && frame < b);

export const BookShort: React.FC<{ book: BookData }> = ({ book }) => {
  const { durationInFrames } = useVideoConfig();

  const musicVolume = (f: number) => {
    const fadeIn = interpolate(f, [0, 24], [0, 1], { extrapolateRight: "clamp" });
    const fadeOut = interpolate(
      f,
      [durationInFrames - 36, durationInFrames - 4],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const target = isInVoiceWindow(f) ? MUSIC_DUCKED : MUSIC_BASE;
    return Math.min(fadeIn, fadeOut) * target;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: book.palette.bg }}>
      <Audio src={staticFile("audio/music-bed.mp3")} volume={musicVolume} />

      <Sequence from={HOOK_START + 4}>
        <Audio src={book.voice.hook} volume={VOICE_GAIN} />
      </Sequence>
      <Sequence from={COVER_START + 6}>
        <Audio src={book.voice.cover} volume={VOICE_GAIN} />
      </Sequence>
      <Sequence from={PILLARS_START + 6}>
        <Audio src={book.voice.pillars} volume={VOICE_GAIN} />
      </Sequence>
      <Sequence from={CTA_START + 6}>
        <Audio src={book.voice.cta} volume={VOICE_GAIN} />
      </Sequence>

      <Sequence from={HOOK_START} durationInFrames={HOOK_DUR}>
        <Hook book={book} durationInFrames={HOOK_DUR} />
      </Sequence>
      <Sequence from={COVER_START} durationInFrames={COVER_DUR}>
        <Cover book={book} durationInFrames={COVER_DUR} />
      </Sequence>
      <Sequence from={PILLARS_START} durationInFrames={PILLARS_DUR}>
        <Pillars book={book} durationInFrames={PILLARS_DUR} />
      </Sequence>
      <Sequence from={CTA_START} durationInFrames={CTA_DUR}>
        <CTA book={book} durationInFrames={CTA_DUR} />
      </Sequence>
    </AbsoluteFill>
  );
};
