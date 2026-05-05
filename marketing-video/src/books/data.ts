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
  bullets: [
    "Physical",
    "Mental",
    "Emotional",
    "Social",
    "Spiritual",
    "Environmental",
  ],
  palette: {
    bg: "#0e2a26",
    bgAccent: "#1d5a4a",
    text: "#f5f3ec",
    accent: "#f6a55c",
  },
};
