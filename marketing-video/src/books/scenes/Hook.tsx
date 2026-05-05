import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import type { BookData } from "../types";
import { easeOut } from "../easing";

export const Hook: React.FC<{ book: BookData; durationInFrames: number }> = ({
  book,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const bannerScale = interpolate(frame, [0, durationInFrames], [1.08, 1.18]);
  const bannerOpacity = interpolate(frame, [0, 12], [0, 0.55], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const hookOpacity = interpolate(frame, [10, 26], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const hookY = interpolate(frame, [10, 30], [40, 0], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: book.palette.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: bannerOpacity * exitOpacity }}>
        <Img
          src={book.banner}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${bannerScale})`,
            filter: "blur(2px) saturate(1.05)",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${book.palette.bg}cc 0%, ${book.palette.bg}99 50%, ${book.palette.bg}f5 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          opacity: exitOpacity,
        }}
      >
        <div
          style={{
            opacity: hookOpacity,
            transform: `translateY(${hookY}px)`,
            color: book.palette.text,
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 800,
            fontSize: 96,
            lineHeight: 1.1,
            letterSpacing: -1,
            textShadow: "0 4px 24px rgba(0,0,0,0.45)",
          }}
        >
          {book.hook}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
