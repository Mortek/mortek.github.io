import { staticFile } from "remotion";
import type { BookPremiumData } from "./types";

export const wealthData: BookPremiumData = {
  id: "wealth-without-permission",
  cover: staticFile("books/wealth-without-permission/cover-1000.png"),
  voiceDir: "audio/voice/wealth-without-permission",

  story: {
    lines: [
      { text: "Nobody taught you this.", voice: "intro_1", durFrames: 35 },
      { text: "Not in school. Not at home.", voice: "intro_2", durFrames: 53 },
      {
        text: "Not anywhere in the system you grew up in.",
        voice: "intro_3",
        durFrames: 72,
      },
      {
        text: "You were taught to work hard, spend reasonably, maybe save a little…",
        voice: "intro_4",
        durFrames: 107,
      },
    ],
    closer: {
      text: "…and trust that things would work out.",
      voice: "intro_off",
      durFrames: 54,
    },
  },

  cta: {
    titleLines: ["There is another way.", "Rewrite the script."],
    titleVoice: { voice: "title", durFrames: 65 },
    pillColor: "#3d8c40",
    pills: [
      { icon: "📊", label: "Cash Flow", voice: "pill_cashflow", durFrames: 27 },
      { icon: "💸", label: "Pay Yourself", voice: "pill_payyourself", durFrames: 28 },
      { icon: "🔑", label: "Crush Debt", voice: "pill_debt", durFrames: 22 },
      { icon: "🛡️", label: "Safety Net", voice: "pill_safetynet", durFrames: 26 },
      { icon: "📈", label: "Invest", voice: "pill_invest", durFrames: 21 },
      { icon: "🏝️", label: "Freedom", voice: "pill_freedom", durFrames: 22 },
    ],
    avail: "WEALTH WITHOUT PERMISSION — AVAILABLE NOW ON AMAZON",
    outro: { voice: "outro", durFrames: 129 },
  },
};
