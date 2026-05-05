import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const MarketingVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 30], [40, 0], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a1040 50%, #2a0a40 100%)",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity: opacity * fadeOut,
          transform: `translateY(${y}px)`,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2 }}>mortek</div>
        <div style={{ fontSize: 40, opacity: 0.7, marginTop: 16 }}>books · apps · music</div>
      </div>
    </AbsoluteFill>
  );
};
