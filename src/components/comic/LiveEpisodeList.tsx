"use client";

import { useEffect, useState, type ComponentProps } from "react";
import type { Episode } from "@/lib/api/types";
import { openComicEpisodes } from "@/lib/openedComics";
import { EpisodeList } from "./EpisodeList";

type Props = ComponentProps<typeof EpisodeList> & {
  // Ask for the real list (reading is live). Otherwise this is just the server's list.
  live: boolean;
};

// The comic page's episode list: the server's placeholders are swapped for the real list, fetched
// once the reader actually opens the page (see openComic in lib/api/client.ts).
export function LiveEpisodeList({ live, episodes, episodesSource, ...rest }: Props) {
  const uuid = rest.comic.uuid;
  // undefined: still loading; null: the request failed, so the server's list stays.
  const [real, setReal] = useState<Episode[] | null | undefined>(live ? undefined : null);

  useEffect(() => {
    if (!live) return;
    let current = true;
    openComicEpisodes(uuid).then((result) => current && setReal(result));
    return () => {
      current = false;
    };
  }, [live, uuid]);

  if (real === undefined) return <EpisodeList {...rest} episodes={episodes} episodesSource="loading" />;
  if (real) return <EpisodeList {...rest} episodes={real} episodesSource="live" />;
  return <EpisodeList {...rest} episodes={episodes} episodesSource={episodesSource} />;
}
