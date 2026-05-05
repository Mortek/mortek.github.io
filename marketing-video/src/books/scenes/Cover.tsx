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
    config: { damping: 14, mass: 0.8, stiffness: 90 },
  });
  const coverScale = interpolate(coverEnter, [0, 1], [0.6, 1]);
  const coverOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const titleOpacity = interpolate(frame, [22, 38], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const titleY = interpolate(frame, [22, 42], [30, 0], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const subtitleOpacity = interpolate(frame, [38, 56], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const subtitleY = interpolate(frame, [38, 60], [24, 0], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const bob = Math.sin((frame / fps) * 1.4) * 6;

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 30%, ${book.palette.bgAccent} 0%, ${book.palette.bg} 65%)`,
        opacity: exitOpacity,
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 220,
        }}
      >
        <div
          style={{
            opacity: coverOpacity,
            transform: `translateY(${bob}px) scale(${coverScale})`,
            filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.55))",
          }}
        >
          <Img
            src={book.cover}
            style={{
              width: 720,
              height: 720,
              objectFit: "contain",
            }}
          />
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 200,
          padding: "0 80px 200px",
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            color: book.palette.text,
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 900,
            fontSize: 160,
            letterSpacing: 4,
            textAlign: "center",
            textShadow: "0 6px 30px rgba(0,0,0,0.5)",
          }}
        >
          {book.title}
        </div>
        <div
          style={{
            opacity: subtitleOpacity * 0.9,
            transform: `translateY(${subtitleY}px)`,
            color: book.palette.text,
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 500,
            fontSize: 38,
            lineHeight: 1.3,
            textAlign: "center",
            marginTop: 24,
            maxWidth: 880,
          }}
        >
          {book.subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
