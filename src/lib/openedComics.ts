import { useEffect, useState } from "react";
import type { Episode } from "@/lib/api/types";

// Browser side of opening a comic (see openComic in lib/api/client.ts). The backend counts a view
// each time, so each comic is asked for once per visit: paging through its episodes, React's dev-mode
// double effect and episode links all reuse the same answer.
const REUSE_MS = 5 * 60 * 1000;
const opened = new Map<string, { at: number; request: Promise<Episode[] | null> }>();

export function openComicEpisodes(uuid: string) {
  const known = opened.get(uuid);
  if (known && Date.now() - known.at < REUSE_MS) return known.request;
  const request = fetch(`/api/comics/${uuid}/open`, { method: "POST" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { episodes?: Episode[] } | null) => data?.episodes ?? null)
    .catch(() => null);
  opened.set(uuid, { at: Date.now(), request });
  return request;
}

// The episode list if this comic was opened in this visit; never asks the server.
export const knownEpisodes = (uuid: string) => opened.get(uuid)?.request;

// How many episodes a comic has, for the reader's Next buttons. Most catalogue lists don't say, so
// when the server doesn't know, this uses the comic's episode list: the one the comic page already
// loaded in this visit, or asked for once here (which counts one view, like opening the comic page).
export function useEpisodeTotal(uuid: string, known: number | null) {
  const [total, setTotal] = useState(known);
  useEffect(() => {
    if (known != null) return;
    let current = true;
    openComicEpisodes(uuid).then((episodes) => {
      if (current && episodes?.length) setTotal(Math.max(...episodes.map((e) => e.number)));
    });
    return () => {
      current = false;
    };
  }, [uuid, known]);
  return total;
}
