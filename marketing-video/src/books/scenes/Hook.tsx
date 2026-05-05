import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import type { BookData } from "../types";
import { easeOut } from "../easing";

export const Hook: React.FC<{ book: BookData; durationInFrames: number }> = ({
  book,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const bannerScale = interpolate(frame, [0, durationInFrames], [1.1, 1.28]);
  const bannerX = interpolate(frame, [0, durationInFrames], [0, -30]);
  const bannerOpacity = interpolate(frame, [0, 18], [0, 0.7], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const hookOpacity = interpolate(frame, [12, 32], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const hookY = interpolate(frame, [12, 36], [60, 0], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const hookScale = interpolate(frame, [12, 36, durationInFrames], [0.92, 1, 1.04], {
    extrapolateLeft: "clamp",
  });

  const glow = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: bannerOpacity * exitOpacity }}>
        <Img
          src={book.banner}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${bannerScale}) translateX(${bannerX}px)`,
            filter: "blur(3px) saturate(1.15) brightness(0.85)",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${book.palette.bg}55 0%, ${book.palette.bg}ee 75%)`,
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 70px",
          opacity: exitOpacity,
        }}
      >
        <div
          style={{
            opacity: hookOpacity,
            transform: `translateY(${hookY}px) scale(${hookScale})`,
            color: book.palette.text,
            textAlign: "center",
            fontFamily:
              "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 900,
            fontSize: 110,
            lineHeight: 1.05,
            letterSpacing: -2,
            textShadow: `0 6px 30px rgba(0,0,0,0.7), 0 0 ${40 + glow * 30}px ${book.palette.accent}${Math.round(glow * 0x55).toString(16).padStart(2, "0")}`,
          }}
        >
          {book.hook}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
