"use client";

import { useEffect, useState } from "react";
import { InkLogoLoader } from "@/components/ui/Loaders";

// Every episode opens behind the Toon Central loader: at least MIN_MS, and until its first page has
// loaded (real pages have no height before then, so the end-of-episode box would show first), but
// never longer than MAX_MS. The pages load underneath meanwhile. Keyed per episode by the reader page.
const MIN_MS = 1500;
const MAX_MS = 8000;
const FADE_MS = 300;

export function EpisodeLoader() {
  const [phase, setPhase] = useState<"loading" | "fading" | "done">("loading");

  useEffect(() => {
    let minPassed = false;
    let firstPageReady = false;
    const reveal = () => {
      if (!minPassed || !firstPageReady) return;
      setPhase("fading");
      setTimeout(() => setPhase("done"), FADE_MS);
    };

    const first = document.querySelector<HTMLImageElement>("img[data-page='1']");
    const onFirstPage = () => {
      firstPageReady = true;
      reveal();
    };
    // No clean first page (it's locked, or stand-ins that are already sized): only the minimum applies.
    if (!first || first.complete) firstPageReady = true;
    else {
      first.addEventListener("load", onFirstPage, { once: true });
      first.addEventListener("error", onFirstPage, { once: true });
    }

    const min = setTimeout(() => {
      minPassed = true;
      reveal();
    }, MIN_MS);
    const max = setTimeout(() => {
      minPassed = firstPageReady = true;
      reveal();
    }, MAX_MS);

    return () => {
      clearTimeout(min);
      clearTimeout(max);
      first?.removeEventListener("load", onFirstPage);
      first?.removeEventListener("error", onFirstPage);
    };
  }, []);

  if (phase === "done") return null;
  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-ink transition-opacity duration-300 ${phase === "fading" ? "opacity-0" : "opacity-100"}`}
    >
      <InkLogoLoader immediate />
    </div>
  );
}
