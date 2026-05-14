import { staticFile } from "remotion";
import type { BookPremiumData } from "./types";

export const wholeData: BookPremiumData = {
  id: "whole",
  cover: staticFile("books/whole/cover-1000.png"),
  voiceDir: "audio/voice/whole",

  story: {
    lines: [
      { text: "You have been to the gym.", voice: "intro_1", durFrames: 37 },
      { text: "You ate well for a month.", voice: "intro_2", durFrames: 40 },
      {
        text: "You tracked your steps, your sleep, your calories.",
        voice: "intro_3",
        durFrames: 76,
      },
      {
        text: "By every external measure, you were healthy.",
        voice: "intro_4",
        durFrames: 69,
      },
    ],
    closer: {
      text: "And yet… something felt off.",
      voice: "intro_off",
      durFrames: 52,
    },
  },

  cta: {
    titleLines: ["You are not just a body.", "You are all six."],
    titleVoice: { voice: "title", durFrames: 72 },
    pillColor: "#3d8c40",
    pills: [
      { icon: "🏃", label: "Physical", voice: "pill_physical", durFrames: 21 },
      { icon: "🧠", label: "Mental", voice: "pill_mental", durFrames: 20 },
      { icon: "💖", label: "Emotional", voice: "pill_emotional", durFrames: 23 },
      { icon: "👥", label: "Social", voice: "pill_social", durFrames: 21 },
      { icon: "🪷", label: "Spiritual", voice: "pill_spiritual", durFrames: 29 },
      { icon: "🌿", label: "Environmental", voice: "pill_environmental", durFrames: 31 },
    ],
    avail: "WHOLE — Available now on Amazon",
    outro: { voice: "outro", durFrames: 162 },
  },
};
