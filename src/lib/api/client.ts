import snapshot from "@/data/snapshot.json";
import { camelize, toComic, toGenre, toShort } from "./normalize";
import type { Comic, Genre, HomeFeed, Short } from "./types";

// Same endpoints the live tooncentralhub.com home page uses. Set TOON_API_BASE_URL
// (the backend's BASE_URL) to go live; without it, or if a request fails, we serve
// a sanitized snapshot of real production data from src/data/snapshot.json.
const BASE_URL = process.env.TOON_API_BASE_URL?.replace(/\/$/, "");
const REVALIDATE_SECONDS = 300;

type Envelope<T> = { success: boolean; message: string; data: T };
type Raw = Record<string, unknown>;

// Returns the camelized `data` payload, or null when the API isn't configured or the request fails.
async function fetchApi<T>(path: string, revalidate = REVALIDATE_SECONDS): Promise<T | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/${path.replace(/^\//, "")}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const body = (await res.json()) as Envelope<unknown>;
    return camelize<T>(body.data);
  } catch (error) {
    console.error(`[api] GET ${path} failed:`, error);
    return null;
  }
}

async function apiGet<T>(path: string, fallback: unknown): Promise<T> {
  return (await fetchApi<T>(path)) ?? camelize<T>(fallback);
}

// Episode counts only come with some lists; copy them onto the same series wherever else it appears.
export function shareEpisodeCounts(lists: Comic[][]): Comic[][] {
  const counts = new Map<string, number>();
  lists.flat().forEach((c) => c.episodes != null && counts.set(c.uuid, c.episodes));
  return lists.map((list) => list.map((c) => (c.episodes == null && counts.has(c.uuid) ? { ...c, episodes: counts.get(c.uuid)! } : c)));
}

// Every comic in the snapshot, de-duplicated; used for offline search.
function snapshotCatalogue(): Comic[] {
  const home = camelize<Record<string, Raw[]>>(snapshot.home);
  const top = camelize<{ comics: Raw[] }>(snapshot.topCarousel).comics;
  const comics = [...Object.values(home).flat(), ...top].map(toComic);
  return [...new Map(comics.map((c) => [c.uuid, c])).values()];
}

// Same endpoint as the live site's search box. An empty query returns what's trending.
export async function searchComics(query: string, limit = 8): Promise<Comic[]> {
  const q = query.trim();
  if (q.length < 2) return (await getHomeFeed()).trending.slice(0, limit);

  const live = await fetchApi<{ comics?: Raw[] } | Raw[]>(
    `/search?query=${encodeURIComponent(q)}&page=1&limit=${limit}`,
    60
  );
  if (live) return (Array.isArray(live) ? live : live.comics ?? []).map(toComic);

  const needle = q.toLowerCase();
  return snapshotCatalogue()
    .filter((c) =>
      [c.title, c.creator.username, ...c.genres].some((field) => field.toLowerCase().includes(needle))
    )
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export async function getHomeFeed(): Promise<HomeFeed> {
  const data = await apiGet<Record<string, Raw[]>>("/home", snapshot.home);
  const list = (key: string) => (data[key] ?? []).map(toComic);

  console.log(data);
  

  return {
    carousel: list("carousel"),
    popularByToonCentral: list("popularByToonCentral"),
    trending: list("trending"),
    recentUploads: list("recentUploads"),
    indieComics: list("indieComics"),
  };
}

export async function getTopCarousel(): Promise<Comic[]> {
  const data = await apiGet<{ comics: Raw[] }>("/home/top-carousel?page=1&limit=10", snapshot.topCarousel);
  return (data.comics ?? []).map(toComic);
}

export async function getShorts(): Promise<Short[]> {
  const data = await apiGet<{ shorts: Raw[] }>("/home/shorts-carousel?page=1&limit=10", snapshot.shortsCarousel);
  return (data.shorts ?? []).map(toShort);
}

// Real catalogue size per genre, read from each genre listing's pagination total. Needs the live API
// (one small request per genre, cached for an hour); returns null offline so callers can fall back.
export async function getGenreCounts(genres: Genre[]): Promise<Map<number, number> | null> {
  if (!BASE_URL) return null;
  const totals = await Promise.all(
    genres.map((genre) =>
      fetchApi<{ pagination?: { total?: number } }>(`/genres/comic/${genre.id}/all?page=1&limit=1`, 3600).then(
        (data) => [genre.id, data?.pagination?.total] as const
      )
    )
  );
  const counts = new Map(totals.filter((t): t is readonly [number, number] => typeof t[1] === "number"));
  return counts.size ? counts : null;
}

export async function getGenres(): Promise<Genre[]> {
  const data = await apiGet<Raw[]>("/selectables/genres", snapshot.genres);
  return (data ?? []).map(toGenre).filter((genre) => genre.slug !== "all");
}
