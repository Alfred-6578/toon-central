"use client";

import Link from "next/link";
import { EpisodeLink } from "@/components/comic/EpisodeLink";
import { comicHref } from "@/lib/format";
import { useEpisodeTotal } from "@/lib/openedComics";

// The box after an episode's last page: on to the next episode, or back to the Mafiki.
export function EpisodeEnd({ uuid, episode, total: known }: { uuid: string; episode: number; total: number | null }) {
  const total = useEpisodeTotal(uuid, known);
  const hasNext = total != null && episode < total;

  return (
    <div className="mx-4 mt-10 border-2 border-line bg-panel p-6 text-center sm:mx-0">
      <p className="font-display text-3xl uppercase leading-none text-white">End of episode {episode}</p>
      <p className="mt-2 text-sm text-slate-400">
        {hasNext ? "The story continues." : total == null ? "More episodes arrive with the live API." : "You're all caught up on this Mafiki."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {hasNext && (
          <EpisodeLink uuid={uuid} episode={episode + 1} className="btn btn-primary px-6 py-3 text-base">
            Next: episode {episode + 1}
          </EpisodeLink>
        )}
        <Link href={comicHref(uuid)} className="btn btn-ghost px-6 py-3 text-base">Back to Mafiki</Link>
      </div>
    </div>
  );
}
