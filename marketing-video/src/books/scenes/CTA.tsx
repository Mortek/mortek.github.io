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
    config: { damping: 16, stiffness: 110 },
  });
  const coverScale = interpolate(coverEnter, [0, 1], [0.85, 1]);
  const coverOpacity = interpolate(frame, [0, 6], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const lineOpacity = interpolate(frame, [16, 32], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const lineY = interpolate(frame, [16, 36], [24, 0], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const ctaPulse = 1 + Math.sin((frame / fps) * 4) * 0.025;
  const ctaOpacity = interpolate(frame, [34, 52], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const authorOpacity = interpolate(frame, [52, 68], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${book.palette.bgAccent} 0%, ${book.palette.bg} 70%)`,
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 260,
        }}
      >
        <div
          style={{
            opacity: coverOpacity,
            transform: `scale(${coverScale})`,
            filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.55))",
          }}
        >
          <Img
            src={book.cover}
            style={{ width: 620, height: 620, objectFit: "contain" }}
          />
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 220,
          padding: "0 80px 220px",
        }}
      >
        <div
          style={{
            opacity: lineOpacity * 0.85,
            transform: `translateY(${lineY}px)`,
            color: book.palette.text,
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 600,
            fontSize: 44,
            letterSpacing: 1,
            textAlign: "center",
          }}
        >
          Now available
        </div>
        <div
          style={{
            opacity: ctaOpacity,
            marginTop: 22,
            padding: "26px 56px",
            backgroundColor: book.palette.accent,
            color: "#1a1a1a",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: 0.5,
            borderRadius: 22,
            transform: `scale(${ctaPulse})`,
            boxShadow: `0 18px 50px ${book.palette.accent}55`,
          }}
        >
          On Amazon
        </div>
        <div
          style={{
            opacity: authorOpacity * 0.75,
            marginTop: 36,
            color: book.palette.text,
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 500,
            fontSize: 38,
            letterSpacing: 2,
          }}
        >
          by {book.author}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
