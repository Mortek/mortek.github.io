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

export const stoicMind: BookData = {
  id: "stoic-mind",
  title: "THE STOIC MIND",
  subtitle:
    "Ancient Wisdom for Anxiety, Distraction, and the Chaos of Modern Life",
  author: "Maurice Moret",
  asin: "B0D32FRDHK",
  cover: staticFile("books/stoic-mind/cover.png"),
  banner: staticFile("books/stoic-mind/banner.png"),
  hook: "Anxious. Distracted. Overwhelmed.",
  voice: {
    hook: staticFile("audio/voice/stoic-mind/hook.wav"),
    cover: staticFile("audio/voice/stoic-mind/cover.wav"),
    cta: staticFile("audio/voice/stoic-mind/cta.wav"),
  },
  palette: {
    bg: "#0d1a2b",
    bgAccent: "#1d3656",
    text: "#f5ede0",
    accent: "#e0a850",
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
