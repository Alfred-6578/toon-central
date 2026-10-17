import type { Comic, Short } from "@/lib/api/types";
import { FREE_EPISODES } from "@/lib/rules";

// The Studio's comic and episode model, shared by server pages and the browser store.
// Live-site monetization: episodes 1–3 are always free; from episode 4 a creator can opt in to earn
// with ads shown alongside the episode, or with credits (readers unlock it; passes and plans unlock it too).
export type EpisodeAccess = "free" | "ads" | "credits";

export const MONETIZE_FROM = FREE_EPISODES + 1;
export const canMonetize = (number: number) => number >= MONETIZE_FROM;

// Older saves used "locked" before ads/credits existed; read those as credits.
export const accessOf = (episode: { access: string }, number: number): EpisodeAccess =>
  !canMonetize(number) ? "free" : episode.access === "locked" ? "credits" : (episode.access as EpisodeAccess);

export const ACCESS_LABEL: Record<EpisodeAccess, string> = { free: "Free", ads: "Ads", credits: "Credits" };

export type StudioEpisode = {
  id: string;
  title: string;
  // Image refs: "idb:…" for uploads in this browser, URLs for the demo's real comics.
  pages: string[];
  access: EpisodeAccess;
  // "scheduled" with a publishAt in the past counts as published (see episodeState).
  status: "draft" | "scheduled" | "published";
  publishAt: string | null;
  // Real comics from the live data don't expose their pages: shown as "pages on the live site".
  pagesKnown: boolean;
};

export type StudioComic = {
  id: string;
  title: string;
  synopsis: string;
  cover: string | null;
  banner: string | null;
  genres: string[];
  schedule: string | null;
  status: "draft" | "published" | "completed";
  episodes: StudioEpisode[];
  reads: number;
  likes: number;
  updatedAt: string;
  // Came from the live data (the "established" demo), so it has a public page.
  live: boolean;
};

export type StudioMode = "new" | "established";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const MAX_GENRES = 3;
export const SYNOPSIS_MAX = 600;

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// The live-site rule as the default for a new episode: the first few free, the rest locked.
// New episodes start free (monetization is opt-in, as on the live site).
export const defaultAccess = (): EpisodeAccess => "free";

export function episodeState(episode: StudioEpisode, now = Date.now()) {
  if (episode.status === "scheduled" && episode.publishAt && Date.parse(episode.publishAt) <= now) return "published";
  return episode.status;
}

// A real comic from the live data, as the Studio sees it. Episode titles and pages aren't public.
export function fromLiveComic(comic: Comic): StudioComic {
  const count = Math.max(1, comic.episodes ?? 1);
  return {
    id: comic.uuid,
    title: comic.title,
    synopsis: comic.description,
    cover: comic.coverImage,
    banner: comic.backgroundImage || null,
    genres: comic.genres.slice(0, MAX_GENRES),
    schedule: comic.updateDays,
    status: comic.status === "COMPLETED" ? "completed" : "published",
    episodes: Array.from({ length: count }, (_, i) => ({
      id: `${comic.uuid}-ep${i + 1}`,
      title: `Episode ${i + 1}`,
      pages: [],
      // Live comics lock episodes past the free ones behind credits/passes.
      access: canMonetize(i + 1) ? "credits" : "free",
      status: "published",
      publishAt: null,
      pagesKnown: false,
    })),
    reads: comic.views,
    likes: comic.likes,
    updatedAt: comic.lastEpisodeAt ?? new Date().toISOString(),
    live: true,
  };
}

export type StudioShort = {
  id: string;
  title: string;
  caption: string;
  // "idb:…" for uploads in this browser, a Cloudinary URL for the demo's real shorts.
  video: string | null;
  cover: string | null;
  durationSeconds: number | null;
  // Shown in the feed as hashtags (#Drama), same as the live shorts.
  genres: string[];
  // A comic of the creator's: the player shows a "From the comic" card and the comic's cover on its disc.
  linkedComicId: string | null;
  allowComments: boolean;
  status: "draft" | "scheduled" | "published";
  publishAt: string | null;
  views: number;
  likes: number;
  updatedAt: string;
  live: boolean;
};

export const SHORT_TITLE_MAX = 80;
export const CAPTION_MAX = 300;
export const SHORT_MAX_SECONDS = 180;
export const SHORT_MAX_MB = 200;

export function shortState(short: StudioShort, now = Date.now()) {
  if (short.status === "scheduled" && short.publishAt && Date.parse(short.publishAt) <= now) return "published";
  return short.status;
}

export function fromLiveShort(short: Short, comicUuidById: Map<number, string>): StudioShort {
  return {
    id: short.uuid,
    title: short.title,
    caption: short.description,
    video: short.video,
    cover: short.coverImage,
    durationSeconds: null,
    genres: short.genres.slice(0, MAX_GENRES),
    linkedComicId: short.comicId != null ? comicUuidById.get(short.comicId) ?? null : null,
    allowComments: true,
    status: "published",
    publishAt: null,
    views: short.views,
    likes: short.likes,
    updatedAt: short.createdAt ?? new Date().toISOString(),
    live: true,
  };
}

// Links inside the Studio keep the demo choice.
export const studioHref = (path: string, mode: StudioMode) => (mode === "established" ? `${path}?studio=established` : path);
