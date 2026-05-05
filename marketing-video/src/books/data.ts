import { staticFile } from "remotion";
import type { BookData } from "./types";

export const whole: BookData = {
  id: "whole",
  title: "WHOLE",
  subtitle:
    "A Practical Guide to Physical, Mental, Emotional, Social, Spiritual, and Environmental Health",
  author: "Maurice Moret",
  asin: "B0D8JTZCHP",
  cover: staticFile("books/whole/cover.png"),
  banner: staticFile("books/whole/banner.png"),
  hook: "Are you really living a whole life?",
  voice: {
    hook: staticFile("audio/voice/whole/hook.wav"),
    cover: staticFile("audio/voice/whole/cover.wav"),
    cta: staticFile("audio/voice/whole/cta.wav"),
  },
  palette: {
    bg: "#0e2a26",
    bgAccent: "#1d5a4a",
    text: "#f5f3ec",
    accent: "#f6a55c",
  },
};

export const dopamineDetox: BookData = {
  id: "dopamine-detox",
  title: "DOPAMINE DETOX",
  subtitle:
    "Reclaim Your Brain, Focus, and Energy in a World Designed to Distract You",
  author: "Maurice Moret",
  asin: "B0D8XJPTY9",
  cover: staticFile("books/dopamine-detox/cover.png"),
  banner: staticFile("books/dopamine-detox/banner.png"),
  hook: "Trapped in the dopamine loop?",
  voice: {
    hook: staticFile("audio/voice/dopamine-detox/hook.wav"),
    cover: staticFile("audio/voice/dopamine-detox/cover.wav"),
    cta: staticFile("audio/voice/dopamine-detox/cta.wav"),
  },
  palette: {
    bg: "#0a1428",
    bgAccent: "#1a2c5a",
    text: "#eef3ff",
    accent: "#00d4ff",
  },
};
