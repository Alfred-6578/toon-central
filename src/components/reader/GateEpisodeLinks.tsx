"use client";

import { EpisodeLink } from "@/components/comic/EpisodeLink";
import { useEpisodeTotal } from "@/lib/openedComics";

// Under the sign-in card: back to the free first episode, or on to the next one (which asks too), so
// signed-out readers can see how far the story goes.
export function GateEpisodeLinks({ uuid, episode, total: known }: { uuid: string; episode: number; total: number | null }) {
  const total = useEpisodeTotal(uuid, known);
  const hasNext = total != null && episode < total;
  const link = "font-semibold text-ink underline underline-offset-4";

  return (
    <p className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ink/60">
      <span>
        Not started? <EpisodeLink uuid={uuid} episode={1} className={link}>Read episode 1</EpisodeLink>
      </span>
      {hasNext && (
        <span>
          <EpisodeLink uuid={uuid} episode={episode + 1} className={link}>Next: episode {episode + 1}</EpisodeLink>
          {total != null && ` of ${total}`}
        </span>
      )}
    </p>
  );
}
