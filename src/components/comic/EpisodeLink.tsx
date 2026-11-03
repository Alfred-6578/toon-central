"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps } from "react";
import { readerHref } from "@/lib/format";
import { knownEpisodes } from "@/lib/openedComics";

type Props = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & { uuid: string; episode: number; episodeId?: number };

// A link into the reader. The backend fetches an episode by its id, not its number, so the link carries
// the id once the comic's episode list is known (from the comic page in this visit). Never prefetched:
// opening an episode counts a view on the backend.
export function EpisodeLink({ uuid, episode, episodeId, ...rest }: Props) {
  const [found, setFound] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (episodeId) return;
    let current = true;
    knownEpisodes(uuid)?.then((episodes) => current && setFound(episodes?.find((e) => e.number === episode)?.id));
    return () => {
      current = false;
    };
  }, [uuid, episode, episodeId]);

  const id = episodeId ?? found;
  return <Link {...rest} prefetch={false} href={`${readerHref(uuid, episode)}${id ? `?id=${id}` : ""}`} />;
}
