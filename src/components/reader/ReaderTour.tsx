"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { findTourTarget, TourSpot } from "@/components/ui/TourSpot";
import { useLocalValue } from "@/lib/localValue";

// The reader's dock fires this to show the guide again.
export const REPLAY_READER_TOUR = "tc:reader-tour";

const SEEN_KEY = "tc-reader-tour-seen";

// Each step points at an element marked data-tour="…". Steps whose element isn't on screen
// (hidden at this width) are skipped.
const STEPS = [
  { target: "episodes", title: "Flip episodes", body: "Jump to the previous or next episode from here, any time." },
  { target: "library", title: "Keep this Mafiki", body: "Bookmark this Mafiki to add it to your library and catch every new episode." },
  { target: "share", title: "Pass it on", body: "Share the episode to Facebook or X, or copy the link for your group chat." },
  { target: "autoscroll", title: "Hands-free reading", body: "Start auto scroll and the pages roll by themselves. Tap the speed to go faster. On a phone, hold a finger down to pause on a panel." },
];

type Spot = { title: string; body: string; rect: DOMRect };

function measure(): Spot[] {
  return STEPS.flatMap((step) => {
    const rect = findTourTarget(step.target);
    return rect ? [{ title: step.title, body: step.body, rect }] : [];
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

  return (
    <TourSpot rect={rect} blocking onBackdrop={finish} labelledBy="reader-tour-title">
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
    </TourSpot>
  );
}
