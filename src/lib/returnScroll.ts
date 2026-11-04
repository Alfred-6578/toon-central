"use client";

import { useEffect } from "react";

// Coming back to a page with Back (our back arrow or the phone's gesture) lands where the reader left
// it. Next doesn't restore it here: the page fills in after it mounts, so it starts at the top.
const KEY = "tc-return-scroll";
let lastBack = 0;
if (typeof window !== "undefined") window.addEventListener("popstate", () => (lastBack = Date.now()));

// Call just before leaving (e.g. a home page short opening /shorts).
export function rememberScroll() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path: window.location.pathname, y: Math.round(window.scrollY) }));
  } catch {
    // Storage unavailable: coming back starts at the top, as before.
  }
}

// On the page that was left: scroll back to the saved spot, but only when it was reached with Back.
export function useRestoreScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let saved: { path: string; y: number } | null = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
      sessionStorage.removeItem(KEY);
    } catch {
      return;
    }
    if (!saved || saved.path !== window.location.pathname || Date.now() - lastBack > 3000) return;
    const y = saved.y;
    const restore = () => window.scrollTo(0, y);
    restore();
    // Sections above can still be filling in: settle on the spot a few times.
    const timers = [120, 400, 900].map((ms) => setTimeout(restore, ms));
    return () => timers.forEach(clearTimeout);
  }, [enabled]);
}
