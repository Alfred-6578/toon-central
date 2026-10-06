import snapshot from "@/data/snapshot.json";
import { camelize, toComic, toGenre, toShort } from "./normalize";
import { creatorSlug, genreSlug } from "@/lib/format";
import type { Comic, ComicPageData, CreatorPageData, Episode, Genre, HomeFeed, Short, SocialLink } from "./types";

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

// Every comic we know about across the home lists, de-duplicated, with episode counts shared.
export async function getCatalogue(): Promise<Comic[]> {
  const [feed, carousel] = await Promise.all([getHomeFeed(), getTopCarousel()]);
  const lists = shareEpisodeCounts([
    feed.trending,
    feed.popularByToonCentral,
    feed.indieComics,
    feed.carousel,
    feed.recentUploads,
    carousel,
  ]);
  return [...new Map(lists.flat().map((c) => [c.uuid, c])).values()];
}

// Matches the live site: the first episodes are free, later ones need Premium.
export const FREE_EPISODES = 3;

function placeholderEpisodes(comic: Comic): Episode[] {
  const count = comic.episodes ?? 0;
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    title: `Episode ${i + 1}`,
    // Only the latest episode's date is known (lastEpisodeAt).
    publishedAt: i === count - 1 ? comic.lastEpisodeAt : null,
    locked: i + 1 > FREE_EPISODES,
  }));
}

function liveEpisodes(raw: Raw | null): Episode[] | null {
  const list = raw && Array.isArray(raw.episodes) ? (raw.episodes as Raw[]) : null;
  if (!list?.length) return null;
  return list.map((e, i) => ({
    number: Number(e.episodeNumber ?? e.number ?? i + 1),
    title: typeof e.title === "string" && e.title ? e.title : `Episode ${i + 1}`,
    publishedAt: typeof e.createdAt === "string" ? e.createdAt : null,
    locked: i + 1 > FREE_EPISODES,
  }));
}

export async function getComicPageData(uuid: string): Promise<ComicPageData | null> {
  const [catalogue, shorts, live] = await Promise.all([
    getCatalogue(),
    getShorts(),
    fetchApi<Raw>(`/comics/${encodeURIComponent(uuid)}`),
  ]);

  const known = catalogue.find((c) => c.uuid === uuid);
  const fromLive = live && typeof live.uuid === "string" ? toComic(live) : null;
  const comic = fromLive ? { ...fromLive, episodes: fromLive.episodes ?? known?.episodes ?? null } : known;
  if (!comic) return null;

  const fromApi = liveEpisodes(live);
  const episodes = fromApi ?? placeholderEpisodes(comic);
  const episodesSource = fromApi ? "live" : episodes.length ? "placeholder" : "unknown";

  const others = catalogue.filter((c) => c.uuid !== comic.uuid);
  const moreFromCreator = others.filter((c) => c.creator.username === comic.creator.username);
  // Similar: most shared genres first, then most read; the creator's own titles are shown separately.
  const similar = others
    .filter((c) => c.creator.username !== comic.creator.username)
    .map((c) => ({ c, shared: c.genres.filter((g) => comic.genres.includes(g)).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || b.c.views - a.c.views)
    .map(({ c }) => c)
    .slice(0, 5);

  return {
    comic,
    episodes,
    episodesSource,
    moreFromCreator,
    similar,
    shorts: shorts.filter((s) => s.comicId === comic.id && !s.isSponsored),
  };
}

// Numbers for the footer's credits box, shared by every page.
export async function getSiteStats() {
  const [catalogue, feed, shorts, genres] = await Promise.all([getCatalogue(), getHomeFeed(), getShorts(), getGenres()]);
  return {
    originals: catalogue.filter((c) => c.isOriginal).length,
    creators: new Set(feed.indieComics.map((c) => c.creator.username)).size,
    shorts: shorts.filter((s) => !s.isSponsored).length,
    genres: genres.length,
  };
}

export type GenreSort = "popular" | "updated" | "az";
export type GenreKind = "all" | "originals" | "indies";

export type GenrePageData = {
  genre: Genre;
  genres: Genre[];
  comics: Comic[];
  // Matches before the kind filter, for the filter counts.
  totals: Record<GenreKind, number>;
  source: "live" | "page";
};

const sorters: Record<GenreSort, (a: Comic, b: Comic) => number> = {
  popular: (a, b) => b.views - a.views,
  updated: (a, b) => (b.lastEpisodeAt ?? "").localeCompare(a.lastEpisodeAt ?? ""),
  az: (a, b) => a.title.localeCompare(b.title),
};

export async function getGenrePageData(slug: string, sort: GenreSort, kind: GenreKind): Promise<GenrePageData | null> {
  const genres = await getGenres();
  const genre = genres.find((g) => genreSlug(g.name) === slug);
  if (!genre) return null;

  // Live: the genre's own listing (the endpoint the live site uses). Offline: the comics we have.
  const live = await fetchApi<{ comics?: Raw[] }>(`/genres/comic/${genre.id}/all?page=1&limit=48`);
  const matches = live?.comics
    ? live.comics.map(toComic)
    : (await getCatalogue()).filter((c) => c.genres.includes(genre.name));

  const totals = {
    all: matches.length,
    originals: matches.filter((c) => c.isOriginal).length,
    indies: matches.filter((c) => !c.isOriginal).length,
  };
  const filtered = kind === "all" ? matches : matches.filter((c) => (kind === "originals" ? c.isOriginal : !c.isOriginal));

  return { genre, genres, comics: [...filtered].sort(sorters[sort]), totals, source: live?.comics ? "live" : "page" };
}

// The genre /genres opens on: the one with the most series (real totals when the API is live).
export async function getDefaultGenre(): Promise<Genre | undefined> {
  const [genres, catalogue] = await Promise.all([getGenres(), getCatalogue()]);
  const live = await getGenreCounts(genres);
  const size = (g: Genre) => live?.get(g.id) ?? catalogue.filter((c) => c.genres.includes(g.name)).length;
  return [...genres].sort((a, b) => size(b) - size(a))[0];
}

export const OFFICIAL_ACCOUNT = "Tooncentralofficial";

// Toon Central's own accounts (same as the footer).
const OFFICIAL_SOCIALS: SocialLink[] = [
  { handle: "tooncentralofficial", platform: "instagram", url: "https://www.instagram.com/tooncentralofficial/" },
  { handle: "tooncentralhq", platform: "x", url: "https://x.com/tooncentralhq" },
];

const SOCIAL_URLS: Record<string, (handle: string) => string> = {
  instagram: (h) => `https://www.instagram.com/${h}/`,
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  x: (h) => `https://x.com/${h}`,
  twitter: (h) => `https://x.com/${h}`,
};

// Creators type handles freely: "4_7studios@instagram", "@cross_frequency", "themachine_cb", "nil".
// Only "handle@platform" with a known platform becomes a link; anything else is shown as text.
function parseSocial(raw: string): SocialLink | null {
  const value = raw.trim();
  if (!value || /^(nil|none|n\/a|-)$/i.test(value)) return null;
  const match = value.match(/^@?([\w.]+)@([a-z]+)$/i);
  if (match) {
    const [, handle, platform] = match;
    const toUrl = SOCIAL_URLS[platform.toLowerCase()];
    return { handle, platform: platform.toLowerCase(), url: toUrl ? toUrl(handle) : null };
  }
  const handle = value.replace(/^@/, "");
  return /^[\w.]+$/.test(handle) ? { handle, platform: null, url: null } : null;
}

export async function getCreatorPageData(slug: string): Promise<CreatorPageData | null> {
  const [catalogue, shorts] = await Promise.all([getCatalogue(), getShorts()]);
  const comics = catalogue.filter((c) => creatorSlug(c.creator.username) === slug).sort((a, b) => b.views - a.views);
  const theirShorts = shorts.filter((s) => !s.isSponsored && creatorSlug(s.creator.username) === slug);
  const creator = comics[0]?.creator ?? theirShorts[0]?.creator;
  if (!creator) return null;

  // Genres they work in, most used first.
  const genreCounts = new Map<string, number>();
  // Animators with no comics get theirs from their shorts.
  (comics.length ? comics.flatMap((c) => c.genres) : theirShorts.flatMap((s) => s.genres)).forEach((g) =>
    genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)
  );
  const genres = [...genreCounts].sort((a, b) => b[1] - a[1]).map(([g]) => g);

  const isOfficial = creator.username === OFFICIAL_ACCOUNT;
  // Per-series handles can point at collaborators or at Toon Central itself, so: the studio page uses
  // the company's own accounts, and creator pages drop Toon Central's handles.
  const socials = isOfficial
    ? OFFICIAL_SOCIALS
    : [
        ...new Map(
          comics
            .map((c) => (c.socialHandle ? parseSocial(c.socialHandle) : null))
            .filter((s): s is SocialLink => s !== null && !/tooncentral/i.test(s.handle))
            .map((s) => [s.handle.toLowerCase(), s])
        ).values(),
      ];

  const known = comics.filter((c) => c.episodes != null);
  const dates = [...comics.map((c) => c.lastEpisodeAt), ...theirShorts.map((s) => s.createdAt)].filter((d): d is string => !!d);

  return {
    creator,
    isOfficial,
    comics,
    shorts: theirShorts,
    genres,
    socials,
    stats: {
      series: comics.length,
      reads: comics.reduce((sum, c) => sum + c.views, 0),
      likes: comics.reduce((sum, c) => sum + c.likes, 0),
      // Only when every series has a known count; a partial total would understate it.
      chapters: comics.length && known.length === comics.length ? known.reduce((sum, c) => sum + (c.episodes ?? 0), 0) : null,
      shortViews: theirShorts.reduce((sum, s) => sum + s.views, 0),
      lastActive: dates.sort().at(-1) ?? null,
    },
  };
}

export type CreatorSort = "popular" | "active" | "az";

// Everyone who publishes: built from the same per-creator data as the profile pages.
export async function getCreatorsDirectory(sort: CreatorSort): Promise<CreatorPageData[]> {
  const [catalogue, shorts] = await Promise.all([getCatalogue(), getShorts()]);
  const slugs = new Set([
    ...catalogue.map((c) => creatorSlug(c.creator.username)),
    ...shorts.filter((s) => !s.isSponsored).map((s) => creatorSlug(s.creator.username)),
  ]);
  const creators = (await Promise.all([...slugs].map(getCreatorPageData))).filter((c): c is CreatorPageData => c !== null);

  const reach = (c: CreatorPageData) => c.stats.reads + c.stats.shortViews;
  const sorters: Record<CreatorSort, (a: CreatorPageData, b: CreatorPageData) => number> = {
    popular: (a, b) => reach(b) - reach(a),
    active: (a, b) => (b.stats.lastActive ?? "").localeCompare(a.stats.lastActive ?? ""),
    az: (a, b) => a.creator.username.localeCompare(b.creator.username, undefined, { sensitivity: "base" }),
  };
  return creators.sort(sorters[sort]);
}
