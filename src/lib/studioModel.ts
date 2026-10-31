import type { Comic, Short } from "@/lib/api/types";
import { FREE_EPISODES, PREVIEW_PAGES } from "@/lib/rules";

// The Studio's comic and episode model, shared by server pages and the browser store.
// Monetization (client's creator-tutorial spec): a creator unlocks it once one of their Mafiki has
// MILESTONE_EPISODES published episodes, and it applies to Mafiki they create after that (never
// switched on for work that already exists). A monetized Mafiki earns with ads or credits from
// episode 4 (1–3 stay free so new readers get hooked); with credits, each episode opens with free
// preview pages and the creator picks the page where paid access begins (the key on a page thumbnail).
export type EpisodeAccess = "free" | "ads" | "credits";
export type Monetization = "none" | "ads" | "credits";

export const MILESTONE_EPISODES = 4;
export const MONETIZE_FROM = FREE_EPISODES + 1;
export const canMonetize = (number: number) => number >= MONETIZE_FROM;

// A comic saved before monetization was per-Mafiki has no setting: it never earns.
export const monetizationOf = (comic: Pick<StudioComic, "monetization">): Monetization => comic.monetization ?? "none";

// How one episode is read: the opening episodes are always free, the rest follow the Mafiki's choice.
export const accessOf = (comic: Pick<StudioComic, "monetization">, number: number): EpisodeAccess => {
  const method = monetizationOf(comic);
  return !canMonetize(number) || method === "none" ? "free" : method;
};

// The page where paid access starts in a credits episode: the creator's pick, else after the free preview.
export const paidFromOf = (episode: Pick<StudioEpisode, "paidFrom">) => episode.paidFrom ?? PREVIEW_PAGES + 1;

// The milestone: any Mafiki with this many episodes out.
export const reachedMilestone = (comics: StudioComic[], now = Date.now()) =>
  comics.some((c) => c.episodes.filter((e) => episodeState(e, now) === "published").length >= MILESTONE_EPISODES);

export const ACCESS_LABEL: Record<EpisodeAccess, string> = { free: "Free", ads: "Ads", credits: "Credits" };

export type StudioEpisode = {
  id: string;
  title: string;
  // Image refs: "idb:…" for uploads in this browser, URLs for the demo's real comics.
  pages: string[];
  // Kept on older saves only; how an episode is read now comes from its Mafiki (accessOf).
  access?: string;
  // Credits episodes: the 1-based page where paid access begins (null: after the free preview).
  paidFrom?: number | null;
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
  // A short video ("idb:…" upload) shown on the Discover main-menu carousel.
  trailer?: string | null;
  genres: string[];
  schedule: string | null;
  status: "draft" | "published" | "completed";
  episodes: StudioEpisode[];
  // Chosen when the Mafiki is created, if the creator had reached the milestone (see monetizationOf).
  monetization?: Monetization;
  // Created after the milestone, so its monetization can be set and changed.
  monetizable?: boolean;
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
    // Live comics lock episodes past the free ones behind credits/passes.
    monetization: "credits",
    monetizable: true,
    episodes: Array.from({ length: count }, (_, i) => ({
      id: `${comic.uuid}-ep${i + 1}`,
      title: `Episode ${i + 1}`,
      pages: [],
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
