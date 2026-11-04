import { useEffect, useState } from "react";
import type { Episode } from "@/lib/api/types";

// Browser side of opening a comic (see openComic in lib/api/client.ts). The backend counts a view
// each time, so each comic is asked for once per visit: paging through its episodes, React's dev-mode
// double effect and episode links all reuse the same answer.
const REUSE_MS = 5 * 60 * 1000;
type Opened = { episodes: Episode[]; views: number; likes: number; likedByReader: boolean | null } | null;
const opened = new Map<string, { at: number; request: Promise<Opened> }>();
const openListeners = new Set<() => void>();

function openComic(uuid: string) {
  const known = opened.get(uuid);
  if (known && Date.now() - known.at < REUSE_MS) return known.request;
  const request = fetch(`/api/comics/${uuid}/open`, { method: "POST" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: Opened) => (data?.episodes ? data : null))
    .catch(() => null);
  opened.set(uuid, { at: Date.now(), request });
  openListeners.forEach((listener) => listener());
  return request;
}

export const openComicEpisodes = (uuid: string) => openComic(uuid).then((data) => data?.episodes ?? null);

// The episode list if this comic was opened in this visit; never asks the server.
export const knownEpisodes = (uuid: string) => opened.get(uuid)?.request.then((data) => data?.episodes ?? null);

// The comic's view and like counts as of opening it, and whether the reader's like is in them, all
// from the same answer (the catalogue's counts can be minutes old). undefined until the page has opened
// the comic, null if that failed. Never asks the server itself.
export type OpenedCounts = { views: number; likes: number; likedByReader: boolean | null };

export function useOpenedCounts(uuid: string) {
  const [counts, setCounts] = useState<OpenedCounts | null | undefined>(undefined);
  useEffect(() => {
    let current = true;
    const check = () => {
      const known = opened.get(uuid);
      if (!known) return;
      openListeners.delete(check);
      known.request.then((data) => current && setCounts(data && { views: data.views, likes: data.likes, likedByReader: data.likedByReader }));
    };
    openListeners.add(check);
    check();
    return () => {
      current = false;
      openListeners.delete(check);
    };
  }, [uuid]);
  return counts;
}

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
