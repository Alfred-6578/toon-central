import snapshot from "@/data/snapshot.json";
import { isLive } from "./config";
import { apiRequest, isEmpty } from "./http";
import { camelize, toComic, toGenre, toShort } from "./normalize";
import { creatorSlug, genreSlug } from "@/lib/format";
import type { Comic, ComicPageData, CreatorPageData, Episode, Genre, HomeFeed, Short, SocialLink } from "./types";

// Public reading data (Phase 1 area "reading"). Same endpoints the live tooncentralhub.com home page
// uses. While the area isn't live, or if a request fails, we serve a sanitized snapshot of real
// production data from src/data/snapshot.json.
const REVALIDATE_SECONDS = 300;

type Raw = Record<string, unknown>;

// Returns the camelized `data` payload, or null when reading isn't live or the request fails.
async function fetchApi<T>(path: string, revalidate = REVALIDATE_SECONDS): Promise<T | null> {
  if (!isLive("reading")) return null;
  const result = await apiRequest<T>(path, { revalidate });
  if (!result.ok) {
    if (!isEmpty(result)) console.error(`[api] GET ${path} failed: ${result.status} ${result.message}`);
    return null;
  }
  return result.data;
}

async function apiGet<T>(path: string, fallback: unknown): Promise<T> {
  return (await fetchApi<T>(path)) ?? camelize<T>(fallback);
}

type Paged = Record<string, unknown> & { pagination?: { totalPages?: number } };

// Walks a paginated listing in large batches so we can filter, sort and paginate on our own server
// with correct totals. Capped so a runaway listing can't stall a page. null when offline.
async function fetchAllRaw(path: string, key: "comics" | "shorts", batch = 100, maxPages = 10): Promise<Raw[] | null> {
  const sep = path.includes("?") ? "&" : "?";
  const first = await fetchApi<Paged>(`${path}${sep}page=1&limit=${batch}`);
  if (!Array.isArray(first?.[key])) return null;
  const totalPages = Math.min(first.pagination?.totalPages ?? 1, maxPages);
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => fetchApi<Paged>(`${path}${sep}page=${i + 2}&limit=${batch}`))
  );
  const items = [first, ...rest].flatMap((page) => (page?.[key] as Raw[] | undefined) ?? []);
  return [...new Map(items.map((item) => [String(item.uuid), item])).values()];
}

async function fetchAllComics(path: string): Promise<Comic[] | null> {
  return (await fetchAllRaw(path, "comics"))?.map(toComic) ?? null;
}

// Episode counts only come with some lists; copy them onto the same comic wherever else it appears.
export function shareEpisodeCounts(lists: Comic[][]): Comic[][] {
  const counts = new Map<string, number>();
  lists.flat().forEach((c) => c.episodes != null && counts.set(c.uuid, c.episodes));
  return lists.map((list) => list.map((c) => (c.episodes == null && counts.has(c.uuid) ? { ...c, episodes: counts.get(c.uuid)! } : c)));
}

// Shorts made from a comic point back to it (cover included, for the player's disc and tie-in card).
export function linkShortsToComics(shorts: Short[], comics: Comic[]): Short[] {
  const byId = new Map(comics.map((c) => [c.id, c]));
  return shorts.map((s) => {
    const comic = s.comicId != null ? byId.get(s.comicId) : undefined;
    return comic ? { ...s, linkedComic: { uuid: comic.uuid, title: comic.title, coverImage: comic.coverImage } } : s;
  });
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

// Every short, not just the homepage's first 10 (for creator pages and the Shorts page).
export async function getAllShorts(): Promise<Short[]> {
  const live = await fetchAllRaw("/home/shorts-carousel", "shorts");
  return live ? live.map(toShort) : getShorts();
}

// Real catalogue size per genre, read from each genre listing's pagination total. Needs the live API
// (one small request per genre, cached for an hour); returns null offline so callers can fall back.
export async function getGenreCounts(genres: Genre[]): Promise<Map<number, number> | null> {
  if (!isLive("reading")) return null;
  const totals = await Promise.all(
    genres.map(async (genre) => {
      const result = await apiRequest<{ pagination?: { total?: number } }>(`/genres/comic/${genre.id}/all?page=1&limit=1`, { revalidate: 3600 });
      // An empty genre comes back as "no record found": that's a count of 0, not an error.
      const total = result.ok ? result.data.pagination?.total : isEmpty(result) ? 0 : undefined;
      return [genre.id, total] as const;
    })
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
  // Live, "new and trending" lists every published comic; the home lists add episode counts.
  const [feed, carousel, everything] = await Promise.all([getHomeFeed(), getTopCarousel(), fetchAllComics("/trending/new-and-trending?filter=all")]);
  const lists = shareEpisodeCounts([
    ...(everything ? [everything] : []),
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
import { FREE_EPISODES } from "@/lib/rules";
export { FREE_EPISODES };

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

export async function getComicPageData(uuid: string): Promise<ComicPageData | null> {
  // The API's comic details (comics/:uuid/view) also count a view, so the server can't use them to
  // build pages: every refresh would add a fake view. Until the backend adds a read-only version, the
  // comic comes from the catalogue and its episode list is built from the episode count.
  const [catalogue, shorts] = await Promise.all([getCatalogue(), getAllShorts()]);

  const comic = catalogue.find((c) => c.uuid === uuid);
  if (!comic) return null;

  const episodes = placeholderEpisodes(comic);
  const episodesSource = episodes.length ? "placeholder" : "unknown";

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
  const [catalogue, feed, shorts, genres] = await Promise.all([getCatalogue(), getHomeFeed(), getAllShorts(), getGenres()]);
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
  const live = await fetchAllComics(`/genres/comic/${genre.id}/all`);
  const matches = live ?? (await getCatalogue()).filter((c) => c.genres.includes(genre.name));

  const totals = {
    all: matches.length,
    originals: matches.filter((c) => c.isOriginal).length,
    indies: matches.filter((c) => !c.isOriginal).length,
  };
  const filtered = kind === "all" ? matches : matches.filter((c) => (kind === "originals" ? c.isOriginal : !c.isOriginal));

  return { genre, genres, comics: [...filtered].sort(sorters[sort]), totals, source: live ? "live" : "page" };
}

// The genre /genres opens on: the one with the most comics (real totals when the API is live).
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
  const [catalogue, shorts] = await Promise.all([getCatalogue(), getAllShorts()]);
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
  // Per-comic handles can point at collaborators or at Toon Central itself, so: the studio page uses
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
      comics: comics.length,
      reads: comics.reduce((sum, c) => sum + c.views, 0),
      likes: comics.reduce((sum, c) => sum + c.likes, 0),
      // Only when every comic has a known count; a partial total would understate it.
      chapters: comics.length && known.length === comics.length ? known.reduce((sum, c) => sum + (c.episodes ?? 0), 0) : null,
      shortViews: theirShorts.reduce((sum, s) => sum + s.views, 0),
      lastActive: dates.sort().at(-1) ?? null,
    },
  };
}

export type CreatorSort = "popular" | "active" | "az";

// Everyone who publishes: built from the same per-creator data as the profile pages.
export async function getCreatorsDirectory(sort: CreatorSort): Promise<CreatorPageData[]> {
  const [catalogue, shorts] = await Promise.all([getCatalogue(), getAllShorts()]);
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

export type OriginalsPageData = {
  comics: Comic[];
  spotlight: Comic | undefined;
  creators: number;
  reads: number;
  source: "live" | "page";
};

// Every Toon Central original, including ones published under a collaborating creator's account.
export async function getOriginalsPageData(sort: GenreSort): Promise<OriginalsPageData> {
  // The live site's "popular by Toon Central" listing is the paginated originals endpoint.
  const live = await fetchAllComics("/home/popular-by-toon-central?filter=all");
  const originals = live ?? (await getCatalogue()).filter((c) => c.isOriginal);
  const comics = [...originals].sort(sorters[sort]);
  return {
    comics,
    // The freshest original leads the page.
    spotlight: [...originals].sort(sorters.updated)[0],
    creators: new Set(originals.map((c) => c.creator.username)).size,
    reads: originals.reduce((sum, c) => sum + c.views, 0),
    source: live ? "live" : "page",
  };
}

export type ShortSort = "popular" | "newest";

export type ShortsPageData = {
  shorts: Short[];
  // Genres present among all shorts, most used first (for the filter chips).
  genres: string[];
  featured: Short | undefined;
  totals: { shorts: number; views: number; animators: number };
  source: "live" | "page";
};

export async function getShortsPageData(genre: string | null, sort: ShortSort): Promise<ShortsPageData> {
  // Live: the full shorts listing (the homepage only shows the first 10). Offline: the snapshot.
  const [all, catalogue] = await Promise.all([getAllShorts(), getCatalogue()]);

  const linked = linkShortsToComics(all, catalogue);

  const counts = new Map<string, number>();
  linked.filter((s) => !s.isSponsored).flatMap((s) => s.genres).forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1));
  const stories = linked.filter((s) => !s.isSponsored);

  const filtered = genre ? linked.filter((s) => s.genres.some((g) => genreSlug(g) === genre)) : linked;
  const sorted = [...filtered].sort((a, b) =>
    sort === "newest" ? (b.createdAt ?? "").localeCompare(a.createdAt ?? "") : b.views - a.views
  );

  return {
    shorts: sorted,
    genres: [...counts].sort((a, b) => b[1] - a[1]).map(([g]) => g),
    // Never an ad.
    featured: [...stories].sort((a, b) => b.views - a.views)[0],
    totals: {
      shorts: stories.length,
      views: stories.reduce((sum, s) => sum + s.views, 0),
      animators: new Set(stories.map((s) => s.creator.username)).size,
    },
    source: isLive("reading") ? "live" : "page",
  };
}
