import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BookData } from "../types";
import { easeOut } from "../easing";

export const Pillars: React.FC<{ book: BookData; durationInFrames: number }> = ({
  book,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const headerY = interpolate(frame, [0, 22], [40, 0], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const headerSpread = interpolate(frame, [0, 60], [14, 4]);

  const dividerScale = interpolate(frame, [12, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, #000 0%, ${book.palette.bg} 30%, ${book.palette.bgAccent} 100%)`,
        opacity: exitOpacity,
      }}
    >
      <AbsoluteFill
        style={{
          padding: "240px 80px 0",
          alignItems: "center",
        }}
      >
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            color: book.palette.text,
            fontFamily:
              "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 800,
            fontSize: 64,
            textAlign: "center",
            letterSpacing: headerSpread,
            textShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 40px ${book.palette.accent}33`,
          }}
        >
          Six pillars of a whole life
        </div>
        <div
          style={{
            width: 220,
            height: 4,
            background: `linear-gradient(90deg, transparent 0%, ${book.palette.accent} 50%, transparent 100%)`,
            marginTop: 32,
            transform: `scaleX(${dividerScale})`,
            borderRadius: 4,
            boxShadow: `0 0 20px ${book.palette.accent}aa`,
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "44px 60px",
            marginTop: 100,
            width: "100%",
          }}
        >
          {book.bullets.map((b, i) => {
            const start = 26 + i * 7;
            const sp = spring({
              frame: Math.max(0, frame - start),
              fps,
              config: { damping: 14, stiffness: 120 },
            });
            const op = interpolate(sp, [0, 1], [0, 1]);
            const dx = interpolate(sp, [0, 1], [60, 0]);
            const sc = interpolate(sp, [0, 1], [0.85, 1]);
            return (
              <div
                key={b}
                style={{
                  opacity: op,
                  transform: `translateX(${dx}px) scale(${sc})`,
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 22,
                    backgroundColor: book.palette.accent,
                    flexShrink: 0,
                    boxShadow: `0 0 32px ${book.palette.accent}, 0 0 8px ${book.palette.accent}`,
                  }}
                />
                <div
                  style={{
                    color: book.palette.text,
                    fontFamily:
                      "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                    fontWeight: 700,
                    fontSize: 60,
                    letterSpacing: 0.5,
                    textShadow: "0 2px 12px rgba(0,0,0,0.5)",
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
