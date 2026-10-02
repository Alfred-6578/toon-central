import type { Comic, Creator, Genre, Short } from "./types";

// The API mixes snake_case (/home) and camelCase (/home/top-carousel) payloads,
// so every response is camelized before it is mapped.
type Raw = Record<string, unknown>;

const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export function camelize<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) return value.map(camelize) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Raw).map(([k, v]) => [toCamel(k), camelize(v)])
    ) as T;
  }
  return value as T;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

function toCreator(user: unknown): Creator {
  const u = (user ?? {}) as Raw;
  return { username: str(u.username) || "Unknown creator", photo: str(u.photo) || null };
}

function toGenreNames(genres: unknown): string[] {
  if (!Array.isArray(genres)) return [];
  return genres
    .map((g: Raw) => str((g.genre as Raw | undefined)?.name ?? g.name))
    .filter(Boolean);
}

export function toComic(raw: Raw): Comic {
  return {
    id: num(raw.id),
    uuid: str(raw.uuid),
    title: str(raw.title),
    description: str(raw.description),
    coverImage: str(raw.coverImage),
    backgroundImage: str(raw.backgroundImage) || str(raw.coverImage),
    status: str(raw.status),
    updateDays: str(raw.updateDays) || null,
    views: num(raw.viewsCount ?? raw.viewCount),
    likes: num(raw.likesCount),
    episodes: raw.episodesCount == null ? null : num(raw.episodesCount),
    lastEpisodeAt: str(raw.lastEpisodeAt) || null,
    isNew: Boolean(raw.isNew),
    hasNewEpisode: Boolean(raw.hasNewEpisode),
    isOriginal: num(raw.publishedByToonCentral) === 1,
    genres: toGenreNames(raw.genres),
    creator: toCreator(raw.user),
  };
}

// Ads are uploaded from a house account; ask the backend for a real is_sponsored flag.
const SPONSOR_ACCOUNTS = /^ads?[\s_-]*account$/i;

export function toShort(raw: Raw): Short {
  const creator = toCreator(raw.user);
  return {
    id: num(raw.id),
    uuid: str(raw.uuid),
    title: str(raw.title),
    description: str(raw.description),
    video: str(raw.upload),
    createdAt: str(raw.createdAt) || null,
    coverImage: str(raw.coverImage),
    views: num(raw.viewsCount ?? raw.viewCount),
    likes: num(raw.likesCount),
    genres: toGenreNames(raw.genres),
    creator,
    comicId: raw.comicId == null ? null : num(raw.comicId),
    linkedComic: null,
    isSponsored: SPONSOR_ACCOUNTS.test(creator.username),
  };
}

export function toGenre(raw: Raw): Genre {
  return { id: num(raw.id), name: str(raw.name), slug: str(raw.slug) };
}
