"use client";

import { useEffect } from "react";
import { useLocalValue } from "@/lib/localValue";
import { pushNotification } from "@/lib/notifications";
import { reachedMilestone, studioHref, type StudioComic, type StudioMode } from "@/lib/studioModel";

// The creator onboarding from the client's "Creator Notifications & Tutorial" doc:
//  A. a welcome card when someone becomes a creator → Steps 1–5 (profile, hub, new Mafiki, chapters, share);
//  B. a congratulations card once their first Mafiki is created → back into Step 4;
//  C. a milestone card once a Mafiki has 4 published episodes → D. Steps 6–7 (monetizing the next Mafiki).
// Steps 6–7 never show before the milestone. Mock: progress lives in this browser, one record per Studio
// demo mode; the real milestone and "first Mafiki" events must come from the server.

export type TutorialStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type State = {
  // Steps 1–5. "paused": closed with "Maybe later"/Skip, not marked complete.
  phase: "none" | "welcome" | "steps" | "paused" | "done";
  step: 1 | 2 | 3 | 4 | 5;
  // The first Mafiki, for Steps 4–5 (its chapter upload and share link).
  comicId: string | null;
  firstMafiki: "none" | "pending" | "seen";
  milestone: "none" | "pending" | "seen";
  // Steps 6–7, started from the milestone card.
  monetize: "off" | "on" | "done";
  monetizeStep: 6 | 7;
};

const INITIAL: State = { phase: "none", step: 1, comicId: null, firstMafiki: "none", milestone: "none", monetize: "off", monetizeStep: 6 };

export type StepSpec = {
  step: TutorialStep;
  // data-tour="…" on the control the card points at.
  target: string;
  title: string;
  body: string;
  // Where the control lives, for "Take me there" when it isn't on this page. Without one (Step 7: the
  // key only exists in a paid episode) the card explains where to find it instead.
  href?: (s: { comicId: string | null }) => string;
  // false: the step ends when the creator does the thing (Step 3 ends when the Mafiki is created).
  next: boolean;
};

// Card copy from the client doc. Step 3 is reworded for this form (3:4 cover, wide banner, one update day).
export const STEPS: StepSpec[] = [
  {
    step: 1,
    target: "profile",
    title: "Welcome to Toon Central",
    body: "Let's get your first Mafiki ready for readers. Add your name, a short bio and a profile picture so readers can get to know you.",
    href: () => "/creator/profile",
    next: true,
  },
  {
    step: 2,
    target: "new-mafiki",
    title: "Your creator hub",
    body: "This is where you create and manage your Mafiki. Explore the creator guides, then choose New Mafiki to start a new work.",
    href: () => "/creator/dashboard",
    next: true,
  },
  {
    step: 3,
    target: "mafiki-form",
    title: "Set up your Mafiki",
    body: "Add a title, synopsis, genres and update day. Upload a portrait cover (3:4) and, if you like, a wide banner, then create your Mafiki.",
    href: () => "/creator/comics/new",
    next: false,
  },
  {
    step: 4,
    target: "upload-chapter",
    title: "Upload your chapters",
    body: "Open your Mafiki, add your chapter pages and publish. Keep your readers engaged by updating your story regularly.",
    href: ({ comicId }) => (comicId ? `/creator/comics/${comicId}` : "/creator/comics"),
    next: true,
  },
  {
    step: 5,
    target: "share",
    title: "Share your Mafiki",
    body: "Copy your Mafiki's link and share it on social media or with friends. Invite readers to follow your work and come back for new chapters.",
    href: ({ comicId }) => (comicId ? `/creator/comics/${comicId}` : "/creator/comics"),
    next: true,
  },
  {
    step: 6,
    target: "monetize",
    title: "Monetize your next Mafiki",
    body: "You've reached the 4-episode milestone. When creating your next Mafiki, choose Ads to show ads alongside your work, or Credits to lock access so readers spend credits to unlock it.",
    href: () => "/creator/comics/new",
    next: true,
  },
  {
    step: 7,
    target: "chapter-key",
    title: "Offer paid access by section",
    body: "For a more flexible option, use the key icon on a page thumbnail to choose where paid access begins. Readers preview the free pages, then spend credits to continue.",
    next: true,
  },
];

export const NOTICE_COPY = {
  welcome: {
    title: "Congratulations on joining us!",
    body: "You're part of a community of storytellers. Let's set up your creator profile and help you publish your first Mafiki, one small step at a time.",
  },
  firstMafiki: {
    title: "Congratulations!",
    body: "You've uploaded your first Mafiki to Toon Central. Great work! Next, add your chapters and share your story so readers can discover it.",
  },
  milestone: {
    title: "You've unlocked monetization!",
    body: "Congratulations on reaching 4 published episodes. Your next Mafiki can use monetization tools. We'll guide you through Ads, Credits and the key/lock option when you create it.",
  },
};

const keyFor = (mode: StudioMode) => `tc-creator-tutorial-${mode}`;

export function useCreatorTutorial(mode: StudioMode) {
  const [raw, setRaw] = useLocalValue(keyFor(mode), "{}");
  let state: State = INITIAL;
  try {
    state = { ...INITIAL, ...JSON.parse(raw) };
  } catch {
    state = INITIAL;
  }
  const write = (patch: Partial<State>) => setRaw(JSON.stringify({ ...state, ...patch }));
  const href = (path: string) => studioHref(path, mode);

  return {
    state,
    href,
    // A. Someone just became a creator.
    welcome: () => {
      if (state.phase !== "none") return;
      write({ phase: "welcome" });
      pushNotification(
        { kind: "welcome", ...NOTICE_COPY.welcome, message: [NOTICE_COPY.welcome.body], cta: { label: "Open Creator Studio", href: "/creator/dashboard" }, art: null },
        `creator-welcome-${mode}`,
        { popup: false }
      );
    },
    start: () => write({ phase: "steps", step: 1 }),
    later: () => write({ phase: "paused" }),
    goTo: (step: TutorialStep) => write(step >= 6 ? { monetize: "on", monetizeStep: step as 6 | 7 } : { phase: "steps", step: step as State["step"] }),
    // The sidebar's "Studio tutorial": Steps 1–5 again from the start.
    restart: () => write({ phase: "steps", step: 1 }),
    finishSteps: () => write({ phase: "done" }),
    finishMonetize: () => write({ monetize: "done" }),
    // B. Their first Mafiki exists: the tutorial's Step 3 is done.
    mafikiCreated: (comicId: string) => {
      if (state.firstMafiki !== "none") return;
      write({ firstMafiki: "pending", comicId, ...(state.phase === "steps" && state.step === 3 ? { step: 4 as const } : {}) });
      pushNotification(
        {
          kind: "milestone",
          ...NOTICE_COPY.firstMafiki,
          message: [NOTICE_COPY.firstMafiki.body],
          cta: { label: "Add your chapters", href: `/creator/comics/${comicId}` },
          art: null,
        },
        `creator-first-mafiki-${mode}`,
        { popup: false }
      );
    },
    continueAfterFirst: () => write({ firstMafiki: "seen", phase: "steps", step: 4 }),
    dismissFirst: () => write({ firstMafiki: "seen" }),
    // C. The milestone card.
    dismissMilestone: () => write({ milestone: "seen" }),
    // D. "Monetize my next Mafiki".
    startMonetize: () => write({ milestone: "seen", monetize: "on", monetizeStep: 6 }),
    milestone: (comics: StudioComic[]) => {
      if (state.milestone !== "none" || !reachedMilestone(comics)) return;
      write({ milestone: "pending" });
      pushNotification(
        {
          kind: "milestone",
          ...NOTICE_COPY.milestone,
          message: [NOTICE_COPY.milestone.body],
          cta: { label: "Monetize my next Mafiki", href: "/creator/comics/new" },
          art: null,
        },
        `creator-monetization-${mode}`,
        { popup: false }
      );
    },
  };
}

// Watches a creator's comics for the 4-episode milestone (wherever the Studio has them loaded).
export function useMilestoneWatch(mode: StudioMode, comics: StudioComic[]) {
  const { milestone, state } = useCreatorTutorial(mode);
  const reached = reachedMilestone(comics);
  useEffect(() => {
    if (reached && state.milestone === "none") milestone(comics);
    // Only re-check when the milestone could have changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reached, state.milestone]);
}
