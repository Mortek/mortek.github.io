import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BookData } from "../types";
import { easeOut } from "../easing";

export const CTA: React.FC<{ book: BookData; durationInFrames: number }> = ({
  book,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const coverEnter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 95 },
  });
  const coverScale = interpolate(coverEnter, [0, 1], [0.7, 1]);
  const coverOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const coverDrift = interpolate(frame, [0, durationInFrames], [0, -10]);
  const haloPulse = 1 + Math.sin((frame / fps) * 2.0) * 0.08;

  const lineOpacity = interpolate(frame, [18, 36], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const lineY = interpolate(frame, [18, 40], [30, 0], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const ctaEnter = spring({
    frame: Math.max(0, frame - 36),
    fps,
    config: { damping: 12, stiffness: 110 },
  });
  const ctaScale = interpolate(ctaEnter, [0, 1], [0.7, 1]) * (1 + Math.sin((frame / fps) * 3.5) * 0.025);
  const ctaOpacity = interpolate(frame, [36, 52], [0, 1], {
    extrapolateRight: "clamp",
  });

  const authorOpacity = interpolate(frame, [56, 76], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, ${book.palette.bgAccent} 0%, ${book.palette.bg} 55%, #000 100%)`,
        opacity: fadeOut,
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 280,
        }}
      >
        <div
          style={{
            position: "relative",
            opacity: coverOpacity,
            transform: `translateY(${coverDrift}px) scale(${coverScale})`,
            filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.7))",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -80,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${book.palette.accent}40 0%, transparent 60%)`,
              transform: `scale(${haloPulse})`,
              filter: "blur(24px)",
            }}
          />
          <Img
            src={book.cover}
            style={{ width: 640, height: 640, objectFit: "contain", position: "relative" }}
          />
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 80px 220px",
        }}
      >
        <div
          style={{
            opacity: lineOpacity * 0.9,
            transform: `translateY(${lineY}px)`,
            color: book.palette.text,
            fontFamily:
              "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 600,
            fontSize: 50,
            letterSpacing: 4,
            textTransform: "uppercase",
            textAlign: "center",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          Now available
        </div>
        <div
          style={{
            opacity: ctaOpacity,
            marginTop: 28,
            padding: "30px 64px",
            backgroundColor: book.palette.accent,
            color: "#1a1a1a",
            fontFamily:
              "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 900,
            fontSize: 72,
            letterSpacing: 1,
            borderRadius: 26,
            transform: `scale(${ctaScale})`,
            boxShadow: `0 22px 60px ${book.palette.accent}77, 0 0 60px ${book.palette.accent}55`,
          }}
        >
          ON AMAZON
        </div>
        <div
          style={{
            opacity: authorOpacity * 0.8,
            marginTop: 38,
            color: book.palette.text,
            fontFamily:
              "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 500,
            fontSize: 38,
            letterSpacing: 6,
            textTransform: "uppercase",
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          by {book.author}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
