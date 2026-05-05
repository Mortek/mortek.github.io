import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BookData } from "../types";
import { easeOut } from "../easing";

export const Cover: React.FC<{ book: BookData; durationInFrames: number }> = ({
  book,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const coverEnter = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.9, stiffness: 80 },
  });
  const coverScale = interpolate(coverEnter, [0, 1], [0.4, 1]);
  const coverOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const coverRotate = interpolate(coverEnter, [0, 1], [-6, 0]);
  const coverDrift = interpolate(frame, [0, durationInFrames], [0, -18]);

  const titleEnter = spring({
    frame: Math.max(0, frame - 24),
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const titleScale = interpolate(titleEnter, [0, 1], [0.8, 1]);
  const titleOpacity = interpolate(frame, [24, 42], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const titleSpread = interpolate(frame, [24, 90], [16, 6]);

  const subtitleOpacity = interpolate(frame, [44, 64], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const subtitleY = interpolate(frame, [44, 68], [24, 0], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const bob = Math.sin((frame / fps) * 1.2) * 7;

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  const haloPulse = 1 + Math.sin((frame / fps) * 1.6) * 0.06;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 35%, ${book.palette.bgAccent} 0%, ${book.palette.bg} 60%, #000 100%)`,
        opacity: exitOpacity,
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 240,
        }}
      >
        <div
          style={{
            position: "relative",
            opacity: coverOpacity,
            transform: `translateY(${bob + coverDrift}px) scale(${coverScale}) rotate(${coverRotate}deg)`,
            filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.7))",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -60,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${book.palette.accent}33 0%, transparent 60%)`,
              transform: `scale(${haloPulse})`,
              filter: "blur(20px)",
            }}
          />
          <Img
            src={book.cover}
            style={{
              width: 760,
              height: 760,
              objectFit: "contain",
              position: "relative",
            }}
          />
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 60px 200px",
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            color: book.palette.text,
            fontFamily:
              "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 900,
            fontSize: 180,
            letterSpacing: titleSpread,
            textAlign: "center",
            textShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 60px ${book.palette.accent}55`,
            lineHeight: 1,
          }}
        >
          {book.title}
        </div>
        <div
          style={{
            opacity: subtitleOpacity * 0.92,
            transform: `translateY(${subtitleY}px)`,
            color: book.palette.text,
            fontFamily:
              "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 500,
            fontSize: 38,
            lineHeight: 1.3,
            textAlign: "center",
            marginTop: 28,
            maxWidth: 880,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {book.subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
