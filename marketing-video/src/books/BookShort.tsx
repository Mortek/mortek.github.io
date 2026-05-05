import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import type { BookData } from "./types";
import { Hook } from "./scenes/Hook";
import { Cover } from "./scenes/Cover";
import { CTA } from "./scenes/CTA";
import { Particles } from "./effects/Particles";
import { Vignette } from "./effects/Vignette";
import { LightSweep } from "./effects/LightSweep";

const HOOK_DUR = 90;
const COVER_DUR = 210;
const CTA_DUR = 150;

const HOOK_START = 0;
const COVER_START = HOOK_DUR;
const CTA_START = HOOK_DUR + COVER_DUR;

export const BOOK_SHORT_DURATION = HOOK_DUR + COVER_DUR + CTA_DUR;

const MUSIC_BASE = 0.22;
const MUSIC_DUCKED = 0.10;
const VOICE_GAIN = 1.0;
const MUSIC_START_FRAME = 60 * 30;

const VOICE_WINDOWS: Array<[number, number]> = [
  [HOOK_START + 6, HOOK_START + HOOK_DUR],
  [COVER_START + 10, COVER_START + COVER_DUR],
  [CTA_START + 8, CTA_START + CTA_DUR],
];

const isInVoiceWindow = (frame: number) =>
  VOICE_WINDOWS.some(([a, b]) => frame >= a && frame < b);

export const BookShort: React.FC<{ book: BookData }> = ({ book }) => {
  const { durationInFrames } = useVideoConfig();

  const musicVolume = (f: number) => {
    const fadeIn = interpolate(f, [0, 30], [0, 1], { extrapolateRight: "clamp" });
    const fadeOut = interpolate(
      f,
      [durationInFrames - 40, durationInFrames - 4],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const target = isInVoiceWindow(f) ? MUSIC_DUCKED : MUSIC_BASE;
    return Math.min(fadeIn, fadeOut) * target;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio
        src={staticFile("audio/music-bed.mp3")}
        volume={musicVolume}
        startFrom={MUSIC_START_FRAME}
      />

      <Sequence from={HOOK_START + 6}>
        <Audio src={book.voice.hook} volume={VOICE_GAIN} />
      </Sequence>
      <Sequence from={COVER_START + 10}>
        <Audio src={book.voice.cover} volume={VOICE_GAIN} />
      </Sequence>
      <Sequence from={CTA_START + 8}>
        <Audio src={book.voice.cta} volume={VOICE_GAIN} />
      </Sequence>

      <Sequence from={HOOK_START} durationInFrames={HOOK_DUR}>
        <Hook book={book} durationInFrames={HOOK_DUR} />
      </Sequence>
      <Sequence from={COVER_START} durationInFrames={COVER_DUR}>
        <Cover book={book} durationInFrames={COVER_DUR} />
      </Sequence>
      <Sequence from={CTA_START} durationInFrames={CTA_DUR}>
        <CTA book={book} durationInFrames={CTA_DUR} />
      </Sequence>

      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <Particles color={book.palette.text} intensity={0.6} />
      </AbsoluteFill>

      <Sequence from={COVER_START + 12} durationInFrames={80}>
        <LightSweep duration={80} color="rgba(255,255,255,0.16)" />
      </Sequence>
      <Sequence from={CTA_START + 10} durationInFrames={70}>
        <LightSweep duration={70} color={`${book.palette.accent}33`} />
      </Sequence>

      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};
