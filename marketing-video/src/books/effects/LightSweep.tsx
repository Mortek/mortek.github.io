import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const LightSweep: React.FC<{
  startFrame?: number;
  duration?: number;
  color?: string;
}> = ({ startFrame = 0, duration = 60, color = "rgba(255,255,255,0.18)" }) => {
  const frame = useCurrentFrame();
  const f = frame - startFrame;
  if (f < 0 || f > duration) return null;
  const x = interpolate(f, [0, duration], [-30, 130]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(115deg, transparent ${x - 18}%, ${color} ${x}%, transparent ${x + 18}%)`,
        }}
      />
    </AbsoluteFill>
  );
};
