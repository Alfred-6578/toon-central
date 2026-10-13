"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";

// After this long, a loader says plainly that it's slow and why that might be. No jokes: someone
// stuck on a bad connection shouldn't feel the site is making light of it.
const SLOW_AFTER_MS = 8000;

// Full-screen loader: the Toon Central logo inked stroke by stroke, then filled, on a loop.
export function InkLogoLoader({ className = "" }: { className?: string }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div role="status" aria-live="polite" className={`delayed-in flex flex-col items-center justify-center gap-6 px-6 text-center ${className}`}>
      <Logo className="ink-logo w-40 text-mint sm:w-48" />
      <span className="sr-only">Loading</span>
      {slow && (
        <p className="max-w-xs text-sm leading-6 text-slate-400">This is taking longer than usual. Check your connection, or try again in a moment.</p>
      )}
    </div>
  );
}

// The small loading icon: a speech bubble mid-sentence. Inherits its colour from the text.
// tailClassName matches the tail to whatever the bubble sits on.
export function BubbleDots({ label = "Loading", className = "", tailClassName = "bg-ink" }: { label?: string; className?: string; tailClassName?: string }) {
  return (
    <span role="status" className={`relative inline-flex items-center ${className}`}>
      <span className="bubble-dots inline-flex h-7 items-center gap-1 border-2 border-current px-2">
        <span className="h-1.5 w-1.5 bg-current" />
        <span className="h-1.5 w-1.5 bg-current" />
        <span className="h-1.5 w-1.5 bg-current" />
      </span>
      {/* Tail, bottom-left */}
      <span aria-hidden="true" className={`absolute -bottom-[5px] left-2 h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-current ${tailClassName}`} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

// Placeholder for a comic card while its data loads: same shape as ComicCard, inked halftone cover.
export function ComicCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="halftone-sweep aspect-[3/4] border-2 border-line" />
      <div className="mt-3 h-4 w-3/4 bg-panel" />
      <div className="mt-2 h-3 w-1/2 bg-panel" />
    </div>
  );
}

export function ComicGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <ComicCardSkeleton key={i} />
      ))}
    </div>
  );
}
