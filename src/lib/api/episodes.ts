import { cache } from "react";
import { isLive } from "./config";
import { apiRequest } from "./http";
import { getAccessToken } from "./token";

// An episode's real pages (comics/:uuid/episode/:id/get), for the reader. Server-only: the page image
// links never go to the browser as-is, the reader decides which ones go out clean (lib/reader.ts).
// The backend counts a view on every call, so it's only made when someone opens the episode, once per
// request (cache), and episode links are never prefetched (EpisodeLink).
export type EpisodePages =
  | { status: "ok"; title: string; pages: string[] }
  // The backend only serves episode 1 to signed-out readers.
  | { status: "signin" }
  | { status: "unavailable" };

type RawEpisode = { episodeNumber?: number; title?: string; comic?: { uuid?: string }; comicImages?: { image?: string }[] };

export const getEpisodePages = cache(async (uuid: string, episodeId: number, episode: number): Promise<EpisodePages> => {
  if (!isLive("reading")) return { status: "unavailable" };
  const token = await getAccessToken();
  const result = await apiRequest<RawEpisode>(`/comics/${encodeURIComponent(uuid)}/episode/${episodeId}/get`, { token, revalidate: false });
  if (!result.ok) {
    if (result.status === 401) return { status: "signin" };
    console.error(`[api] GET comics/${uuid}/episode/${episodeId}/get failed: ${result.status} ${result.message}`);
    return { status: "unavailable" };
  }
  // The id comes from the link, so make sure it really is this comic's episode with this number.
  const { data } = result;
  if (data.comic?.uuid !== uuid || data.episodeNumber !== episode) return { status: "unavailable" };
  const pages = (data.comicImages ?? []).map((image) => image.image).filter((src): src is string => !!src);
  return pages.length ? { status: "ok", title: data.title ?? "", pages } : { status: "unavailable" };
});
