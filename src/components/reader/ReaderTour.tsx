"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalValue } from "@/lib/localValue";

// The reader's dock fires this to show the guide again.
export const REPLAY_READER_TOUR = "tc:reader-tour";

const SEEN_KEY = "tc-reader-tour-seen";

// Each step points at an element marked data-tour="…". Steps whose element isn't on screen
// (hidden at this width) are skipped.
const STEPS = [
  { target: "episodes", title: "Flip episodes", body: "Jump to the previous or next episode from here, any time." },
  { target: "library", title: "Keep the series", body: "Bookmark this series to add it to your library and catch every new episode." },
  { target: "share", title: "Pass it on", body: "Share the episode to Facebook or X, or copy the link for your group chat." },
  { target: "autoscroll", title: "Hands-free reading", body: "Start auto scroll and the pages roll by themselves. Tap the speed to go faster. On a phone, hold a finger down to pause on a panel." },
];

type Spot = { title: string; body: string; rect: DOMRect };

const PAD = 6;
const CARD_GAP = 14;

function measure(): Spot[] {
  return STEPS.flatMap((step) => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    const rect = el?.getBoundingClientRect();
    return rect && rect.width > 0 && rect.height > 0 ? [{ title: step.title, body: step.body, rect }] : [];
  });
}

// First-visit guide to the reader: spotlights each control in turn with a speech-bubble caption.
// Shown once per browser; the dock's "?" button brings it back.
export function ReaderTour() {
  // Server and first paint say "seen", so the guide never flashes in before we know.
  const [seen, setSeen] = useLocalValue(SEEN_KEY, "0", "1");
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [spots, setSpots] = useState<Spot[]>([]);
  const nextRef = useRef<HTMLButtonElement>(null);
  const open = seen !== "1" && ready && spots.length > 0;

  // Give the page a moment to lay out (and the reader to look at it) before the first visit's guide.
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 900);
    const replay = () => {
      setIndex(0);
      setSeen("0");
      setReady(true);
    };
    window.addEventListener(REPLAY_READER_TOUR, replay);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(REPLAY_READER_TOUR, replay);
    };
  }, [setSeen]);

  useEffect(() => {
    if (seen === "1" || !ready) return;
    let frame = requestAnimationFrame(() => setSpots(measure()));
    const remeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setSpots(measure()));
    };
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure);
    };
  }, [seen, ready]);

  const finish = useCallback(() => {
    setSeen("1");
    setIndex(0);
  }, [setSeen]);

  useEffect(() => {
    if (!open) return;
    nextRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, finish]);

  if (!open) return null;

  const step = Math.min(index, spots.length - 1);
  const { title, body, rect } = spots[step];
  const last = step === spots.length - 1;

  // Caption below the control when there's room, otherwise above it; kept inside the screen sideways.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardWidth = Math.min(320, vw - 32);
  const below = rect.bottom + 220 < vh;
  const left = Math.min(Math.max(rect.left + rect.width / 2 - cardWidth / 2, 16), vw - cardWidth - 16);
  const tailLeft = Math.min(Math.max(rect.left + rect.width / 2 - left - 10, 18), cardWidth - 38);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="reader-tour-title" className="fixed inset-0 z-[60]">
      {/* Catches clicks so the page underneath can't be used mid-guide. */}
      <div className="absolute inset-0" onClick={finish} aria-hidden="true" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute border-[3px] border-mint transition-all duration-300"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
          boxShadow: "0 0 0 3px #000, 0 0 0 200vmax rgba(7, 11, 20, 0.8)",
        }}
      />

      <div
        className="absolute border-[3px] border-black bg-paper p-5 text-ink shadow-[5px_5px_0_#000] transition-all duration-300"
        style={{
          width: cardWidth,
          left,
          ...(below ? { top: rect.bottom + PAD + CARD_GAP } : { bottom: vh - rect.top + PAD + CARD_GAP }),
        }}
      >
        {/* Speech-bubble tail pointing at the control. */}
        <span
          aria-hidden="true"
          className={`absolute h-5 w-5 rotate-45 border-black bg-paper ${below ? "-top-[11px] border-l-[3px] border-t-[3px]" : "-bottom-[11px] border-b-[3px] border-r-[3px]"}`}
          style={{ left: tailLeft }}
        />

        <p className="font-display text-xs uppercase tracking-widest text-mint-deep">
          Step {step + 1} of {spots.length}
        </p>
        <h2 id="reader-tour-title" className="mt-1 font-display text-2xl uppercase leading-none">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={finish} className="mr-auto text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-ink">
            Skip
          </button>
          {step > 0 && (
            <button type="button" onClick={() => setIndex(step - 1)} className="border-2 border-ink px-3 py-1.5 text-sm font-bold hover:bg-ink hover:text-white">
              Back
            </button>
          )}
          <button
            ref={nextRef}
            type="button"
            onClick={() => (last ? finish() : setIndex(step + 1))}
            className="border-2 border-black bg-mint px-4 py-1.5 text-sm font-bold shadow-[3px_3px_0_#000] hover:bg-white"
          >
            {last ? "Start reading" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
