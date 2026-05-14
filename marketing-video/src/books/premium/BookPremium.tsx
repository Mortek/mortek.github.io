import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import type { BookPremiumData } from "./types";
import { computeSchedule, type Schedule, type StoryLineSched } from "./schedule";

const { fontFamily: PLAYFAIR } = loadPlayfair("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});
const { fontFamily: PLAYFAIR_ITALIC } = loadPlayfair("italic", {
  weights: ["500"],
  subsets: ["latin"],
});
void PLAYFAIR_ITALIC;
const { fontFamily: INTER } = loadInter("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

const THEME = {
  teal: "#1a9e8f",
  white: "#ffffff",
  green: "#3d8c40",
  bgTop: "#06121d",
  bgBottom: "#000305",
};

const MUSIC_BASE = 0.22;
const MUSIC_DUCKED = 0.10;
const VOICE_GAIN = 1.6;
const MUSIC_START_FRAME = 60 * 30;

// ------------------------------------------------------------------
// FloatingParticles
// ------------------------------------------------------------------
const PARTICLE_COUNT = 42;
const seedRand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const PARTICLE_PALETTE = [THEME.teal, THEME.white, THEME.green];

const FloatingParticles: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity }}>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const r1 = seedRand(i + 1);
        const r2 = seedRand(i + 47);
        const r3 = seedRand(i + 113);
        const r4 = seedRand(i + 211);
        const size = 2 + r4 * 4;
        const baseOpacity = 0.1 + r2 * 0.3;
        const driftSpeed = 14 + r3 * 24;
        const sway = Math.sin(t * (0.3 + r1 * 0.4) + r1 * 6.28) * 22;
        const baseY = (r3 * 1.4 - 0.2) * height;
        const y =
          ((baseY - t * driftSpeed) % (height * 1.3) + height * 1.3) %
            (height * 1.3) -
          height * 0.15;
        const x = r1 * width + sway;
        const color = PARTICLE_PALETTE[i % PARTICLE_PALETTE.length];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              backgroundColor: color,
              opacity: baseOpacity,
              filter: `blur(${1 + r4 * 2}px)`,
              boxShadow: `0 0 ${size * 5}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------
// AnimatedText (fadeUp only — story uses StoryLine, CTA uses inline)
// ------------------------------------------------------------------
const FadeUpText: React.FC<{
  text: string;
  startFrame: number;
  font: string;
  size: number;
  color: string;
  weight?: number | string;
  letterSpacing?: number;
  shadow?: string;
  style?: React.CSSProperties;
}> = ({
  text,
  startFrame,
  font,
  size,
  color,
  weight = 600,
  letterSpacing = 0,
  shadow = "0 2px 24px rgba(0,0,0,0.55)",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  const s = spring({
    frame: Math.max(0, local),
    fps,
    config: { damping: 18, mass: 0.8, stiffness: 90 },
  });
  const opacity = interpolate(local, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ty = interpolate(s, [0, 1], [28, 0]);
  return (
    <div
      style={{
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        color,
        letterSpacing,
        textShadow: shadow,
        lineHeight: 1.15,
        opacity,
        transform: `translateY(${ty}px)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// ------------------------------------------------------------------
// BookCover3D
// ------------------------------------------------------------------
const BookCover3D: React.FC<{
  src: string;
  size: number;
  glow?: number;
  rotateY?: number;
  rotateX?: number;
}> = ({ src, size, glow = 1, rotateY = -8, rotateX = 3 }) => (
  <div style={{ position: "relative", width: size, height: size, perspective: 1200 }}>
    <div
      style={{
        position: "absolute",
        inset: -size * 0.08,
        background: `radial-gradient(circle at 50% 50%, ${THEME.teal}${Math.round(
          glow * 0x44
        )
          .toString(16)
          .padStart(2, "0")} 0%, transparent 60%)`,
        filter: "blur(28px)",
        opacity: 0.95,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: -size * 0.05,
        background: `radial-gradient(circle at 50% 50%, ${THEME.white}22 0%, transparent 55%)`,
        filter: "blur(14px)",
        opacity: glow,
      }}
    />
    <div
      style={{
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
        transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
        filter: `drop-shadow(0 30px 60px rgba(0,0,0,0.65)) drop-shadow(0 0 ${
          16 + glow * 20
        }px ${THEME.teal}${Math.round(glow * 0x66).toString(16).padStart(2, "0")})`,
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: 6,
        }}
      />
    </div>
    <div
      style={{
        position: "absolute",
        left: "10%",
        right: "10%",
        bottom: -size * 0.06,
        height: size * 0.08,
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 70%)",
        filter: "blur(12px)",
      }}
    />
  </div>
);

// ------------------------------------------------------------------
// Background — slow gradient bleed
// ------------------------------------------------------------------
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const bleed = interpolate(frame, [0, 200], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 110%, ${THEME.teal}${Math.round(
          bleed * 0x55
        )
          .toString(16)
          .padStart(2, "0")} 0%, ${THEME.bgTop} 45%, ${THEME.bgBottom} 100%)`,
      }}
    />
  );
};

// ------------------------------------------------------------------
// StoryLine — text fades in synced with its voice clip start
// ------------------------------------------------------------------
const StoryLine: React.FC<{
  line: StoryLineSched;
  size: number;
  italic?: boolean;
}> = ({ line, size, italic = false }) => {
  const frame = useCurrentFrame();
  const local = frame - line.at;
  if (local < -2 || local > line.hold + 14) return null;

  const fadeIn = interpolate(local, [0, 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(local, [line.hold, line.hold + 12], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ty = interpolate(local, [0, 10], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "0 7%",
        opacity: fadeIn * fadeOut,
      }}
    >
      <div
        style={{
          fontFamily: PLAYFAIR,
          fontWeight: 500,
          fontStyle: italic ? "italic" : "normal",
          fontSize: size,
          color: THEME.white,
          textAlign: "center",
          lineHeight: 1.2,
          textShadow: `0 4px 36px rgba(0,0,0,0.8), 0 0 60px ${THEME.teal}33`,
          transform: `translateY(${ty}px)`,
        }}
      >
        {line.text}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------
// SceneStory
// ------------------------------------------------------------------
const SceneStory: React.FC<{ schedule: Schedule }> = ({ schedule }) => {
  const frame = useCurrentFrame();
  const sceneDur = schedule.storyDuration;

  const bloom = Math.sin(
    interpolate(frame, [0, sceneDur], [0, Math.PI], { extrapolateRight: "clamp" })
  );
  const exitOpacity = interpolate(frame, [sceneDur - 14, sceneDur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${THEME.teal}33 0%, transparent 60%)`,
          opacity: 0.4 + bloom * 0.4,
          mixBlendMode: "screen",
        }}
      />
      {schedule.storyLines.map((l) => (
        <StoryLine key={l.at} line={l} size={68} />
      ))}
      <StoryLine line={schedule.storyCloser} size={78} italic />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------
// DimensionPill
// ------------------------------------------------------------------
const DimensionPill: React.FC<{
  icon: string;
  label: string;
  color: string;
  fontSize: number;
  fromX: number;
  startFrame: number;
}> = ({ icon, label, color, fontSize, fromX, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  const s = spring({
    frame: Math.max(0, local),
    fps,
    config: { damping: 12, stiffness: 110 },
  });
  const opacity = interpolate(local, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tx = interpolate(s, [0, 1], [fromX, 0]);
  const sc = interpolate(s, [0, 1], [0.85, 1]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${tx}px) scale(${sc})`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 24px",
        borderRadius: 999,
        background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)`,
        border: `1px solid ${color}66`,
        boxShadow: `0 8px 28px ${color}33, inset 0 1px 0 ${color}55`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ fontSize: fontSize * 1.1, lineHeight: 1 }}>{icon}</div>
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 600,
          fontSize,
          letterSpacing: 1,
          color: THEME.white,
          textShadow: `0 0 12px ${color}88`,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// SceneCTA
// ------------------------------------------------------------------
const SceneCTA: React.FC<{
  data: BookPremiumData;
  schedule: Schedule;
}> = ({ data, schedule }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const sceneDur = schedule.ctaDuration;

  const inOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });

  // Title (top)
  const title1Spring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const title1Opacity = interpolate(frame, [8, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const title2Spring = spring({
    frame: Math.max(0, frame - 22),
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const title2Opacity = interpolate(frame, [22, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Book
  const bookEnter = spring({
    frame: Math.max(0, frame - schedule.sceneBookStart),
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 80 },
  });
  const bookOpacity = interpolate(
    frame,
    [schedule.sceneBookStart, schedule.sceneBookStart + 24],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const bookScale = interpolate(bookEnter, [0, 1], [0.78, 1]);

  // Final fade-out
  const fadeBlack = interpolate(frame, [sceneDur - 24, sceneDur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Layout for 1080×1920
  const titleSize1 = 60;
  const titleSize2 = 80;
  const pillSize = 32;
  const coverSize = Math.min(680, width * 0.66);

  const titleTop = height * 0.07;
  const pillsTop = height * 0.22;
  const bookTop = height * 0.47;
  const availTop = height * 0.92;

  return (
    <AbsoluteFill style={{ opacity: inOpacity * fadeBlack }}>
      {/* Title block */}
      <div
        style={{
          position: "absolute",
          top: titleTop,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 6%",
        }}
      >
        <div
          style={{
            opacity: title1Opacity,
            transform: `translateY(${interpolate(title1Spring, [0, 1], [22, 0])}px)`,
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: titleSize1,
            color: THEME.white,
            textShadow: "0 4px 20px rgba(0,0,0,0.7)",
            lineHeight: 1.15,
          }}
        >
          {data.cta.titleLines[0]}
        </div>
        <div
          style={{
            opacity: title2Opacity,
            transform: `translateY(${interpolate(title2Spring, [0, 1], [22, 0])}px)`,
            fontFamily: PLAYFAIR,
            fontWeight: 700,
            fontSize: titleSize2,
            color: THEME.teal,
            textShadow: `0 0 36px ${THEME.teal}88, 0 4px 18px rgba(0,0,0,0.6)`,
            lineHeight: 1.15,
            marginTop: 4,
          }}
        >
          {data.cta.titleLines[1]}
        </div>
      </div>

      {/* Pills */}
      <div
        style={{
          position: "absolute",
          top: pillsTop,
          left: 0,
          right: 0,
          padding: "0 6%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        {schedule.pills.map((p) => (
          <DimensionPill
            key={p.label}
            icon={p.icon}
            label={p.label}
            color={data.cta.pillColor}
            fontSize={pillSize}
            fromX={width * 0.6}
            startFrame={p.sceneEnterAt}
          />
        ))}
      </div>

      {/* Book */}
      <div
        style={{
          position: "absolute",
          top: bookTop,
          left: "50%",
          transform: `translateX(-50%) scale(${bookScale})`,
          transformOrigin: "top center",
          opacity: bookOpacity,
        }}
      >
        <BookCover3D src={data.cover} size={coverSize} glow={1} rotateY={0} rotateX={0} />
      </div>

      {/* Available-on-Amazon line */}
      <div
        style={{
          position: "absolute",
          top: availTop,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <FadeUpText
          text={data.cta.avail}
          startFrame={schedule.sceneOutroAt + 20}
          font={INTER}
          size={28}
          color={THEME.teal}
          weight={600}
          letterSpacing={3}
          style={{ textTransform: "uppercase" }}
          shadow={`0 0 18px ${THEME.teal}88`}
        />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------
// Vignette
// ------------------------------------------------------------------
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%)",
    }}
  />
);

// ------------------------------------------------------------------
// Master composition
// ------------------------------------------------------------------
export function bookPremiumDuration(data: BookPremiumData): number {
  return computeSchedule(data).totalDuration;
}

const v = (dir: string, name: string) => staticFile(`${dir}/${name}.wav`);

export const BookPremium: React.FC<{ data: BookPremiumData }> = ({ data }) => {
  const schedule = computeSchedule(data);

  // Voice schedule — absolute frames
  const voiceSchedule: Array<{ at: number; src: string; durFrames: number }> = [];
  for (const l of schedule.storyLines) {
    voiceSchedule.push({ at: l.at, src: v(data.voiceDir, l.voice), durFrames: l.durFrames });
  }
  voiceSchedule.push({
    at: schedule.storyCloser.at,
    src: v(data.voiceDir, schedule.storyCloser.voice),
    durFrames: schedule.storyCloser.durFrames,
  });
  voiceSchedule.push({
    at: schedule.ctaStart + schedule.titleSceneAt,
    src: v(data.voiceDir, data.cta.titleVoice.voice),
    durFrames: schedule.titleDurFrames,
  });
  for (const p of schedule.pills) {
    voiceSchedule.push({
      at: schedule.ctaStart + p.sceneVoiceAt,
      src: v(data.voiceDir, p.voice),
      durFrames: p.durFrames,
    });
  }
  voiceSchedule.push({
    at: schedule.ctaStart + schedule.sceneOutroAt,
    src: v(data.voiceDir, data.cta.outro.voice),
    durFrames: schedule.outroDurFrames,
  });

  const inVoiceWindow = (f: number) =>
    voiceSchedule.some(({ at, durFrames }) => f >= at && f < at + durFrames);

  const totalDur = schedule.totalDuration;
  const musicVolume = (f: number) => {
    const fadeIn = interpolate(f, [0, 30], [0, 1], { extrapolateRight: "clamp" });
    const fadeOut = interpolate(f, [totalDur - 40, totalDur - 4], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const target = inVoiceWindow(f) ? MUSIC_DUCKED : MUSIC_BASE;
    return Math.min(fadeIn, fadeOut) * target;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio
        src={staticFile("audio/music-bed.mp3")}
        startFrom={MUSIC_START_FRAME}
        volume={musicVolume}
      />
      {voiceSchedule.map((vs, i) => (
        <Sequence key={i} from={vs.at}>
          <Audio src={vs.src} volume={VOICE_GAIN} />
        </Sequence>
      ))}

      <Background />
      <FloatingParticles opacity={0.55} />

      <Sequence from={0} durationInFrames={schedule.storyDuration}>
        <SceneStory schedule={schedule} />
      </Sequence>
      <Sequence from={schedule.ctaStart} durationInFrames={schedule.ctaDuration}>
        <SceneCTA data={data} schedule={schedule} />
      </Sequence>

      <Vignette />
    </AbsoluteFill>
  );
};
