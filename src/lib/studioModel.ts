import type { Comic, Short } from "@/lib/api/types";
import { FREE_EPISODES, PREVIEW_PAGES } from "@/lib/rules";

// The Studio's comic and episode model, shared by server pages and the browser store.
// Monetization, on every Mafiki: episodes 1–3 are always free (new readers get hooked). From episode 4,
// each episode can show ads (it stays free to read) and can have locked panels, panel by panel:
// readers unlock them with credits one at a time or the whole episode at once. Both can be on together.

// A Mafiki earns from its 4th episode: the "milestone" the creator tutorial celebrates.
export const MILESTONE_EPISODES = 4;
export const MONETIZE_FROM = FREE_EPISODES + 1;
export const canMonetize = (number: number) => number >= MONETIZE_FROM;

type LegacyEpisode = Pick<StudioEpisode, "monetize" | "paidFrom">;
// Older saves said how a whole episode (or Mafiki) earned instead: "ads", or "credits" from a page on.
const legacyOf = (comic: Pick<StudioComic, "monetization">, episode: LegacyEpisode) =>
  episode.monetize ?? (comic.monetization === "none" ? undefined : comic.monetization);

// Whether episode `number` shows ads.
export const adsOn = (comic: Pick<StudioComic, "monetization">, number: number, episode: (LegacyEpisode & Pick<StudioEpisode, "ads">) | null) =>
  canMonetize(number) && !!episode && (episode.ads ?? legacyOf(comic, episode) === "ads");

// Episode `number`'s locked panels: 1-based page numbers, in order.
export function lockedPanelsOf(
  comic: Pick<StudioComic, "monetization">,
  number: number,
  episode: (LegacyEpisode & Pick<StudioEpisode, "lockedPanels" | "pages">) | null
): number[] {
  if (!canMonetize(number) || !episode) return [];
  const count = episode.pages.length;
  if (episode.lockedPanels) return [...new Set(episode.lockedPanels)].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  if (legacyOf(comic, episode) !== "credits") return [];
  const from = episode.paidFrom ?? PREVIEW_PAGES + 1;
  return Array.from({ length: Math.max(0, count - from + 1) }, (_, i) => from + i);
}

// A live comic's episode whose pages we can't see but that the live site locks (past the free ones).
export const lockedOnSite = (comic: Pick<StudioComic, "monetization">, number: number, episode: LegacyEpisode & Pick<StudioEpisode, "pagesKnown">) =>
  canMonetize(number) && !episode.pagesKnown && legacyOf(comic, episode) === "credits";

export const publishedCount = (comic: Pick<StudioComic, "episodes">, now = Date.now()) =>
  comic.episodes.filter((e) => episodeState(e, now) === "published").length;

// The first Mafiki with its 4th episode out, if any (it can now earn).
export const milestoneComic = (comics: StudioComic[], now = Date.now()) =>
  comics.find((c) => publishedCount(c, now) >= MILESTONE_EPISODES) ?? null;
export const reachedMilestone = (comics: StudioComic[], now = Date.now()) => milestoneComic(comics, now) !== null;


// Ad offers (Creator 101, "Making money"): spots in every episode of a Mafiki that advertisers can buy.
// The creator picks where, up to MAX_AD_SPOTS, once the Mafiki has MILESTONE_EPISODES episodes out.
export const AD_SPOTS = ["top", "middle", "bottom"] as const;
export type AdSpot = (typeof AD_SPOTS)[number];
export const MAX_AD_SPOTS = 2;
export const AD_SPOT_LABEL: Record<AdSpot, { name: string; where: string }> = {
  top: { name: "Top", where: "Before the first page" },
  middle: { name: "Middle", where: "Halfway through the episode" },
  bottom: { name: "Bottom", where: "After the last page" },
};
export const adSpotsAllowed = (comic: Pick<StudioComic, "episodes">) => publishedCount(comic) >= MILESTONE_EPISODES;
// The chosen spots in reading order, none when the Mafiki can't have ads yet.
export const adSpotsOf = (comic: Pick<StudioComic, "episodes" | "adSpots">): AdSpot[] =>
  adSpotsAllowed(comic) ? AD_SPOTS.filter((spot) => comic.adSpots?.includes(spot)) : [];

export type StudioEpisode = {
  id: string;
  title: string;
  // Image refs: "idb:…" for uploads in this browser, URLs for the demo's real comics.
  pages: string[];
  // Episodes from MONETIZE_FROM on: ads shown alongside it (see adsOn).
  ads?: boolean;
  // Episodes from MONETIZE_FROM on: 1-based page numbers readers unlock with credits (see lockedPanelsOf).
  lockedPanels?: number[];
  // Shown in the Mafiki's episode list; the first page stands in when there's none.
  thumbnail?: string | null;
  // Older saves only, read by adsOn / lockedPanelsOf: the whole episode's earning ("ads"/"credits"),
  // and for credits the page where paid pages began.
  access?: string;
  monetize?: "free" | "ads" | "credits";
  paidFrom?: number | null;
  // "scheduled" with a publishAt in the past counts as published (see episodeState).
  status: "draft" | "scheduled" | "published";
  publishAt: string | null;
  // Real comics from the live data don't expose their pages: shown as "pages on the live site".
  pagesKnown: boolean;
};

export type StudioComic = {
  // The public uuid (also the Studio's URL id).
  id: string;
  // The backend's number for it, on the creator's real Mafiki (mode "live").
  apiId?: number;
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
  // Older saves only: one setting for the whole Mafiki, before monetization was per episode.
  monetization?: "none" | "ads" | "credits";
  // Older saves only: whether that setting could be chosen.
  monetizable?: boolean;
  // Where advertisers can buy a spot in each episode (see AD_SPOTS); none when missing.
  adSpots?: AdSpot[];
  reads: number;
  likes: number;
  updatedAt: string;
  // Has a public page: the "established" demo's real comics, or a published one in mode "live".
  live: boolean;
};

// "new" and "established" are demos kept in this browser; "live" is the signed-in creator's real
// Mafiki and shorts from the backend (when the studio area is live).
export type StudioMode = "new" | "established" | "live";

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
    episodes: Array.from({ length: count }, (_, i) => ({
      id: `${comic.uuid}-ep${i + 1}`,
      title: `Episode ${i + 1}`,
      // Live comics lock episodes past the free ones behind credits/passes.
      monetize: canMonetize(i + 1) ? ("credits" as const) : undefined,
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
  // The backend's number for it, on the creator's real shorts (mode "live").
  apiId?: number;
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
