"use client";

import { useCallback, useState } from "react";
import type { Short } from "@/lib/api/types";
import { ShortCard } from "./ShortCard";
import { ShortsFeed } from "./ShortsFeed";

export function ShortsRail({ shorts }: { shorts: Short[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Lengths become known once a short is opened in the player (previews are trimmed clips).
  // Keep the latest value: a stream Cloudinary is still transcoding can report a short duration first.
  const [durations, setDurations] = useState<Record<string, number>>({});

  const recordDuration = useCallback((uuid: string, seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    setDurations((prev) => (prev[uuid] === seconds ? prev : { ...prev, [uuid]: seconds }));
  }, []);
  const close = useCallback(() => setOpenIndex(null), []);

  return (
    <>
      <div className="hide-scrollbar -mx-6 overflow-x-auto px-6 pb-3 pt-1 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
        <div className="flex w-max gap-5">
          {shorts.map((short, i) => (
            <ShortCard
              key={short.uuid}
              short={short}
              duration={durations[short.uuid]}
              onOpen={() => setOpenIndex(i)}
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
