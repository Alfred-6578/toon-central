"use client";

import { useCallback, useState } from "react";
import type { Short } from "@/lib/api/types";
import { rememberScroll, useRestoreScroll } from "@/lib/returnScroll";
import { ShortCard } from "./ShortCard";
import { ShortsFeed } from "./ShortsFeed";

// `openOnShortsPage`: tapping a short opens the full /shorts feed at that short (the home page), so
// it's the same feed, order and player everywhere. Otherwise the rail plays just its own shorts in an
// overlay (a comic's or a creator's shorts).
export function ShortsRail({ shorts, openOnShortsPage = false }: { shorts: Short[]; openOnShortsPage?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Lengths become known once a short is opened in the player (previews are trimmed clips).
  // Keep the latest value: a stream Cloudinary is still transcoding can report a short duration first.
  const [durations, setDurations] = useState<Record<string, number>>({});

  const recordDuration = useCallback((uuid: string, seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    setDurations((prev) => (prev[uuid] === seconds ? prev : { ...prev, [uuid]: seconds }));
  }, []);
  const close = useCallback(() => setOpenIndex(null), []);
  // Back from /shorts returns to this spot on the page.
  useRestoreScroll(openOnShortsPage);

  return (
    <>
      <div className="hide-scrollbar -mx-6 overflow-x-auto px-6 pb-3 pt-1 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
        <div className="flex w-max gap-5">
          {shorts.map((short, i) => (
            <ShortCard
              key={short.uuid}
              short={short}
              duration={durations[short.uuid]}
              href={openOnShortsPage ? `/shorts?short=${short.uuid}` : undefined}
              onOpen={openOnShortsPage ? rememberScroll : () => setOpenIndex(i)}
            />
          ))}
        </div>
      </div>

      {openIndex !== null && (
        <ShortsFeed shorts={shorts} startIndex={openIndex} onClose={close} onDuration={recordDuration} />
      )}
    </>
  );
}
