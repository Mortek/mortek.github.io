import type { BookPremiumData } from "./types";

// Tunables shared by every BookPremium video.
const STORY_FIRST_LINE_AT = 12;
const STORY_LINE_GAP = 8;
const STORY_CLOSER_PAUSE = 30; // dramatic beat before closer
const STORY_LINE_HOLD_PAD = 6; // text holds slightly past voice
const STORY_CLOSER_HOLD_PAD = 10;
const STORY_FADE_OUT = 24;

const CTA_TITLE_AT = 18;
const CTA_PILLS_START = 100;
const CTA_PILL_GAP = 38;
const CTA_PILL_VOICE_OFFSET = 4;
const CTA_BOOK_GAP = 30; // after last pill voice ends
const CTA_OUTRO_GAP = 50; // after book begins fading in
const CTA_OUTRO_TAIL = 84; // breath after outro before fade
const CTA_FADE_OUT = 24;

export type StoryLineSched = {
  text: string;
  voice: string;
  durFrames: number;
  at: number; // scene-local frame
  hold: number;
};

export type PillSched = {
  icon: string;
  label: string;
  voice: string;
  durFrames: number;
  sceneEnterAt: number;
  sceneVoiceAt: number;
};

export type Schedule = {
  storyDuration: number;
  storyLines: StoryLineSched[];
  storyCloser: StoryLineSched;
  ctaStart: number;
  ctaDuration: number;
  titleSceneAt: number;
  titleDurFrames: number;
  pills: PillSched[];
  sceneBookStart: number;
  sceneOutroAt: number;
  outroDurFrames: number;
  totalDuration: number;
};

export function computeSchedule(data: BookPremiumData): Schedule {
  // Story
  let cursor = STORY_FIRST_LINE_AT;
  const storyLines: StoryLineSched[] = data.story.lines.map((l) => {
    const item: StoryLineSched = {
      ...l,
      at: cursor,
      hold: l.durFrames + STORY_LINE_HOLD_PAD,
    };
    cursor += l.durFrames + STORY_LINE_GAP;
    return item;
  });
  // Bigger pause before the closer
  cursor += STORY_CLOSER_PAUSE - STORY_LINE_GAP;
  const storyCloser: StoryLineSched = {
    ...data.story.closer,
    at: cursor,
    hold: data.story.closer.durFrames + STORY_CLOSER_HOLD_PAD,
  };
  cursor += data.story.closer.durFrames + STORY_FADE_OUT;
  const storyDuration = cursor;

  // CTA
  const titleSceneAt = CTA_TITLE_AT;
  const pills: PillSched[] = data.cta.pills.map((p, i) => {
    const sceneEnterAt = CTA_PILLS_START + i * CTA_PILL_GAP;
    return {
      ...p,
      sceneEnterAt,
      sceneVoiceAt: sceneEnterAt + CTA_PILL_VOICE_OFFSET,
    };
  });
  const lastPill = pills[pills.length - 1];
  const lastPillVoiceEnd = lastPill.sceneVoiceAt + lastPill.durFrames;
  const sceneBookStart = lastPillVoiceEnd + CTA_BOOK_GAP;
  const sceneOutroAt = sceneBookStart + CTA_OUTRO_GAP;
  const sceneOutroEnd = sceneOutroAt + data.cta.outro.durFrames;
  const ctaDuration = sceneOutroEnd + CTA_OUTRO_TAIL + CTA_FADE_OUT;

  return {
    storyDuration,
    storyLines,
    storyCloser,
    ctaStart: storyDuration,
    ctaDuration,
    titleSceneAt,
    titleDurFrames: data.cta.titleVoice.durFrames,
    pills,
    sceneBookStart,
    sceneOutroAt,
    outroDurFrames: data.cta.outro.durFrames,
    totalDuration: storyDuration + ctaDuration,
  };
}
