import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { BookData } from "../types";
import { easeOut } from "../easing";

export const Pillars: React.FC<{ book: BookData; durationInFrames: number }> = ({
  book,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const headerY = interpolate(frame, [0, 18], [24, 0], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${book.palette.bg} 0%, ${book.palette.bgAccent} 100%)`,
        opacity: exitOpacity,
      }}
    >
      <AbsoluteFill
        style={{
          padding: "260px 100px 0",
          alignItems: "center",
        }}
      >
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            color: book.palette.text,
            fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 700,
            fontSize: 56,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          Six pillars of a whole life
        </div>
        <div
          style={{
            width: 140,
            height: 4,
            backgroundColor: book.palette.accent,
            marginTop: 28,
            opacity: headerOpacity,
            borderRadius: 4,
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px 56px",
            marginTop: 90,
            width: "100%",
          }}
        >
          {book.bullets.map((b, i) => {
            const start = 22 + i * 8;
            const op = interpolate(frame, [start, start + 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: easeOut,
            });
            const dx = interpolate(frame, [start, start + 18], [40, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: easeOut,
            });
            return (
              <div
                key={b}
                style={{
                  opacity: op,
                  transform: `translateX(${dx}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 18,
                    backgroundColor: book.palette.accent,
                    flexShrink: 0,
                    boxShadow: `0 0 24px ${book.palette.accent}aa`,
                  }}
                />
                <div
                  style={{
                    color: book.palette.text,
                    fontFamily:
                      "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                    fontWeight: 600,
                    fontSize: 54,
                    letterSpacing: 0.5,
                  }}
                >
                  {b}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
