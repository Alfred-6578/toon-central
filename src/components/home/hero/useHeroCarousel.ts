"use client";

import { useCallback, useRef, useState, useSyncExternalStore, type FocusEvent, type PointerEvent } from "react";

export const SLIDE_MS = 7000;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

// Slide state shared by every hero layout: autoplay, pausing, swiping and image preloading.
export function useHeroCarousel(count: number) {
  const [index, setIndex] = useState(0);
  // Only slides that have been shown (plus the next one) get their images in the DOM.
  const [loaded, setLoaded] = useState(() => new Set([0, 1]));
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => false);
  const tabHidden = useSyncExternalStore(subscribeVisibility, () => document.hidden, () => false);

  const autoplay = count > 1 && !reducedMotion;
  const running = autoplay && !userPaused && !hovered && !keyboardFocus && !tabHidden;

  const goTo = useCallback(
    (target: number) => {
      if (!count) return;
      const next = (target + count) % count;
      setIndex(next);
      setLoaded((prev) => new Set([...prev, next, (next + 1) % count]));
    },
    [count]
  );

  // Pause while the mouse is over the hero or keyboard focus is inside it.
  const rootHandlers = {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === "mouse") setHovered(true);
    },
    onPointerLeave: () => setHovered(false),
    onFocus: (event: FocusEvent) => {
      if ((event.target as HTMLElement).matches(":focus-visible")) setKeyboardFocus(true);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setKeyboardFocus(false);
    },
  };

  // Horizontal swipe on touch screens changes slide.
  const swipeHandlers = {
    onPointerDown: (event: PointerEvent) => {
      if (event.pointerType !== "mouse") swipeStart.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent) => {
      const start = swipeStart.current;
      swipeStart.current = null;
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(index + (dx < 0 ? 1 : -1));
    },
  };

  return {
    index,
    loaded,
    autoplay,
    running,
    userPaused,
    togglePaused: () => setUserPaused((paused) => !paused),
    goTo,
    rootHandlers,
    swipeHandlers,
  };
}

export type HeroState = ReturnType<typeof useHeroCarousel>;
