"use client";

import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { EpisodeLink } from "@/components/comic/EpisodeLink";
import { useEpisodeTotal } from "@/lib/openedComics";

const navButton =
  "flex h-9 w-9 items-center justify-center border-2 border-line text-lg text-slate-200 hover:border-mint hover:text-white";
const navButtonOff = "flex h-9 w-9 items-center justify-center border-2 border-line text-lg text-slate-600";

// The top bar's previous / "Ep N / total" / next. Next is there whenever a later episode exists, signed
// in or not: signed-out readers meet the sign-in card on it, which is the point.
export function EpisodeNav({ uuid, episode, total: known }: { uuid: string; episode: number; total: number | null }) {
  const total = useEpisodeTotal(uuid, known);
  const hasNext = total != null && episode < total;

  return (
    <div data-tour="episodes" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      {episode > 1 ? (
        <EpisodeLink uuid={uuid} episode={episode - 1} aria-label="Previous episode" className={navButton}><IoChevronBack /></EpisodeLink>
      ) : (
        <span aria-hidden="true" className={navButtonOff}><IoChevronBack /></span>
      )}
      <p className="min-w-[3.25rem] text-center font-display text-lg uppercase leading-none text-white sm:text-xl">
        Ep {episode}
        {total != null && <span className="hidden text-slate-500 sm:inline"> / {total}</span>}
      </p>
      {hasNext ? (
        <EpisodeLink uuid={uuid} episode={episode + 1} aria-label="Next episode" className={navButton}><IoChevronForward /></EpisodeLink>
      ) : (
        <span aria-hidden="true" className={navButtonOff}><IoChevronForward /></span>
      )}
    </div>
  );
}
