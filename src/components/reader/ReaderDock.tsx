"use client";

import { useEffect, useRef, useState } from "react";
import { IoArrowUp, IoHelp, IoPause, IoPlay } from "react-icons/io5";
import { useLocalValue } from "@/lib/localValue";
import { REPLAY_READER_TOUR } from "@/components/reader/ReaderTour";

// Auto-scroll speeds in pixels per second, slow enough at ×1 to read a dense speech bubble.
const SPEEDS = [
  { label: "×1", pxPerSecond: 45 },
  { label: "×2", pxPerSecond: 85 },
  { label: "×3", pxPerSecond: 140 },
];

const dockButton =
  "flex h-11 items-center justify-center border-2 border-black bg-ink text-white shadow-[3px_3px_0_#000] transition-colors hover:bg-panel";

// Floating controls in the reader's corner: auto-scroll (off until the reader starts it), its speed,
// the first-visit guide again, and back to the top.
export function ReaderDock() {
  const [on, setOn] = useState(false);
  const [speedIndex, setSpeedIndex] = useLocalValue("tc-reader-speed", "0");
  const speed = SPEEDS[Number(speedIndex)] ?? SPEEDS[0];
  const [showTop, setShowTop] = useState(false);

  // A finger on the screen holds the scroll so the reader can linger on a panel; lifting it carries on.
  const held = useRef(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!on) return;
    let frame = 0;
    let last = performance.now();
    // Sub-pixel steps would be rounded away each frame, so carry the remainder over.
    let carry = 0;

    const tick = (now: number) => {
      const elapsed = Math.min(now - last, 100);
      last = now;
      if (!held.current && !document.hidden) {
        carry += (speed.pxPerSecond * elapsed) / 1000;
        const step = Math.trunc(carry);
        if (step) {
          carry -= step;
          // "instant": the page's smooth scroll-behavior would otherwise fight every frame.
          window.scrollBy({ top: step, behavior: "instant" });
        }
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
          setOn(false);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const hold = () => (held.current = true);
    const release = () => (held.current = false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOn(false);
    };
    window.addEventListener("touchstart", hold, { passive: true });
    window.addEventListener("touchend", release);
    window.addEventListener("touchcancel", release);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      held.current = false;
      window.removeEventListener("touchstart", hold);
      window.removeEventListener("touchend", release);
      window.removeEventListener("touchcancel", release);
      window.removeEventListener("keydown", onKey);
    };
  }, [on, speed.pxPerSecond]);

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-2.5 sm:right-6">
      {showTop && (
        <button
          type="button"
          onClick={() => {
            setOn(false);
            window.scrollTo({ top: 0 });
          }}
          aria-label="Back to top"
          className={`${dockButton} w-11 text-lg`}
        >
          <IoArrowUp />
        </button>
      )}

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(REPLAY_READER_TOUR))}
        aria-label="How the reader works"
        title="How the reader works"
        className={`${dockButton} w-11 text-lg`}
      >
        <IoHelp />
      </button>

      <div data-tour="autoscroll" className="flex shadow-[3px_3px_0_#000]">
        {on && (
          <button
            type="button"
            onClick={() => setSpeedIndex(String((Number(speedIndex) + 1) % SPEEDS.length))}
            aria-label={`Scroll speed ${speed.label}, change speed`}
            className="flex h-11 w-12 items-center justify-center border-2 border-r-0 border-black bg-paper font-display text-lg text-ink"
          >
            {speed.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          aria-pressed={on}
          className={`flex h-11 items-center gap-2 border-2 border-black px-4 font-display text-base uppercase tracking-wide transition-colors ${
            on ? "bg-sun text-ink" : "bg-mint text-ink hover:bg-white"
          }`}
        >
          {on ? <IoPause /> : <IoPlay />}
          {on ? "Pause" : "Auto scroll"}
        </button>
      </div>
    </div>
  );
}
