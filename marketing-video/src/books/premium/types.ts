// Per-book data shape for the BookPremium template.
// `at`/`hold` for story lines are scene-local frames computed by the schedule
// helper — book data only needs to declare *content* and clip durations.

export type Clip = {
  text: string;
  voice: string; // basename of WAV file under voiceDir, no extension
  durFrames: number;
};

export type PillData = {
  icon: string; // emoji
  label: string;
  voice: string;
  durFrames: number;
};

export type BookPremiumData = {
  id: string;
  cover: string; // staticFile() result
  voiceDir: string; // e.g. "audio/voice/whole"
  story: {
    lines: Clip[];
    closer: Clip;
  };
  cta: {
    titleLines: [string, string];
    titleVoice: { voice: string; durFrames: number };
    pills: PillData[];
    pillColor: string;
    avail: string;
    outro: { voice: string; durFrames: number };
  };
};
