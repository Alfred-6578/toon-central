// "Before you upload": the creators' guide to vertical storytelling, transcribed from the client's Figma
// (Creator 101 → Uploading). Example art is cropped from the Figma export at screenshot resolution; swap in
// the original exports when the client sends them (same file names, in /public/creator-guide/uploading).

export type GuideExample = {
  src: string;
  width: number;
  height: number;
  verdict: "do" | "dont" | null;
  caption?: string;
};

export type GuideRule = { text: string; examples: GuideExample[] };

export type GuidePart = { id: string; title: string; rules: GuideRule[] };

export type GuideSection = { id: string; n: number; title: string; lead: string; parts: GuidePart[] };

const art = (file: string, width: number, height: number, verdict: GuideExample["verdict"], caption?: string): GuideExample => ({
  src: `/creator-guide/uploading/${file}.webp`,
  width,
  height,
  verdict,
  caption,
});

export const GUIDE_INTRO = {
  title: "Before you upload",
  intro: [
    "This isn't a class on writing, or on art.",
    "It's here to help you understand vertical storytelling, the format every Mafiki you create will use.",
  ],
  callout: "Before you upload, make sure your Mafiki follows these guidelines. Keep three things in mind:",
};

// Pixels to points, for setting type at the sizes below.
export const SIZE_TABLE = {
  px: [10, 18, 20, 24, 30],
  pt72: ["10 pt", "18 pt", "20 pt", "24 pt", "30 pt"],
  pt300: ["2.4 pt", "4.32 pt", "4.8 pt", "5.76 pt", "7.2 pt"],
};

export const GUIDE: GuideSection[] = [
  {
    id: "readability",
    n: 1,
    title: "Readability",
    lead: "Your story should be easy to read on a phone.",
    parts: [
      {
        id: "panel-placement",
        title: "Panel placement",
        rules: [
          {
            text: "Lay your panels out vertically, so each panel can be seen on its own.",
            examples: [art("01-panel-placement-bad", 446, 887, "dont"), art("02-panel-placement-good", 430, 1813, "do")],
          },
        ],
      },
      {
        id: "speech-bubbles",
        title: "Speech bubble placement",
        rules: [
          {
            text: "The less effort it takes to follow the text, the better. Keep the reader's eyes moving in a straight line, top to bottom.",
            examples: [art("03-speech-bubble-placement-bad", 666, 888, "dont"), art("04-speech-bubble-placement-good", 474, 876, "do")],
          },
        ],
      },
      {
        id: "fonts",
        title: "Fonts",
        rules: [
          {
            text: "Use legible fonts: fonts that are easy to read.",
            examples: [art("05-legible-font-bad", 294, 257, "dont"), art("06-legible-font-good", 297, 259, "do")],
          },
          {
            text: "Stick to a single font as much as you can, and use 2–3 at most in one comic.",
            examples: [art("07-single-font-bad", 317, 464, "dont"), art("08-single-font-good", 321, 467, "do")],
          },
        ],
      },
      {
        id: "font-sizes",
        title: "Font sizes",
        rules: [
          {
            text: "Make your text big enough to read with ease.",
            examples: [art("09-font-size-bad", 419, 382, "dont"), art("10-font-size-good", 424, 382, "do")],
          },
          {
            text: "Keep the font size the same throughout.",
            examples: [art("11-consistent-font-size-bad", 329, 260, "dont"), art("12-consistent-font-size-good", 327, 257, "do")],
          },
        ],
      },
      {
        id: "size-chart",
        title: "Size chart",
        rules: [
          {
            text: "Panel sizes vary, but a good rule of thumb: the top of one panel and the bottom of the next should be about 1280 pixels apart, on a canvas 800 pixels wide. Feel free to work at a higher resolution and scale down when you export. Set text about 18 pixels tall or more.",
            examples: [art("13-size-chart", 453, 649, null, "800 px wide, 1280 px from panel to panel")],
          },
        ],
      },
    ],
  },
  {
    id: "clarity",
    n: 2,
    title: "Clarity",
    lead: "The story should come across clearly and be easy to follow.",
    parts: [
      {
        id: "amount-of-information",
        title: "Amount of information",
        rules: [
          {
            text: "Keep things easy to digest by limiting what's on screen at once: 1–3 panels per screen, and 0–3 speech bubbles per panel.",
            examples: [art("15-amount-of-information-bad", 339, 676, "dont"), art("16-amount-of-information-good", 339, 678, "do")],
          },
        ],
      },
      {
        id: "object-of-focus",
        title: "Object of focus",
        rules: [
          {
            text: "Keep the object of focus clear at all times.",
            examples: [
              art("17-object-of-focus-bad", 331, 701, "dont", "Here we want the king to be the object of focus"),
              art("18-object-of-focus-good", 334, 698, "do"),
            ],
          },
        ],
      },
      {
        id: "time-and-space",
        title: "Sense of time and space",
        rules: [
          {
            text: "Use time and location stamps whenever they're needed.",
            examples: [art("19-time-location-stamp-bad", 316, 629, "dont"), art("20-time-location-stamp-good", 321, 641, "do")],
          },
          {
            text: "Use a gradient or grayscale to show a flashback.",
            examples: [art("21-flashback-grayscale-good", 335, 642, "do"), art("22-flashback-gradient-good", 339, 680, "do")],
          },
          {
            text: "Use an establishing shot when the setting changes.",
            examples: [art("23-establishing-shot-bad", 368, 618, "dont", "Where are they?"), art("24-establishing-shot-good", 412, 931, "do")],
          },
          {
            text: "Keep action and combat clear at all times. Characters' moves should be easy to follow, so the reader knows what's going on.",
            examples: [
              art("25-action-clarity-bad", 292, 943, "dont", "What happened?"),
              art("26-action-clarity-good", 318, 1163, "do", "The sequence makes much more sense now"),
            ],
          },
        ],
      },
    ],
  },
  {
    id: "pacing",
    n: 3,
    title: "Pacing",
    lead: "The story should keep the reader scrolling, all the way to the next episode.",
    parts: [
      {
        id: "release-pacing",
        title: "Release pacing",
        rules: [
          {
            text: "Publish fuller episodes, even if that means uploading less often, instead of short, incomplete episodes every day.",
            examples: [
              art("27-release-pacing-bad", 561, 546, "dont", "Three short drops: 5, 6 and 4 panels"),
              art("28-release-pacing-good", 530, 958, "do", "One full episode: 20+ panels"),
            ],
          },
        ],
      },
      {
        id: "episode-pacing",
        title: "Episode pacing",
        rules: [
          {
            text: "Use gutter space (the gap between panels) to control how fast the reader scrolls.",
            examples: [
              art("29-gutter-space-lacking", 447, 1441, null, "Little gutter space"),
              art("30-gutter-space-used", 445, 3229, null, "With gutter space, the sequence feels more emotional"),
            ],
          },
          {
            text: "Use repetition and zoom to control intensity and build up to the moments that matter.",
            examples: [
              art("31-build-up-fewer-panels", 450, 1683, null, "Fewer build-up panels: it feels sudden, without much impact"),
              art("32-build-up-more-panels", 454, 4322, null, "More build-up panels"),
            ],
          },
        ],
      },
    ],
  },
];
