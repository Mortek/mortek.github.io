import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

const COUNT = 60;

const seedRand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export const Particles: React.FC<{ color?: string; intensity?: number }> = ({
  color = "#ffffff",
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: COUNT }, (_, i) => {
        const r1 = seedRand(i + 1);
        const r2 = seedRand(i + 101);
        const r3 = seedRand(i + 201);
        const r4 = seedRand(i + 301);
        const speed = 0.06 + r2 * 0.18;
        const driftX = Math.sin(t * speed * 0.6 + r1 * 6.28) * 24;
        const baseY = (r3 * 1.6 - 0.3) * height;
        const y = ((baseY - t * (40 + r2 * 90)) % (height * 1.4) + height * 1.4) % (height * 1.4) - height * 0.2;
        const x = r1 * width + driftX;
        const size = 2 + r4 * 6;
        const opacity = (0.15 + r2 * 0.55) * intensity;
        const blur = 1 + r4 * 3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              backgroundColor: color,
              opacity,
              filter: `blur(${blur}px)`,
              boxShadow: `0 0 ${size * 4}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
