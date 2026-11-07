import { isLive } from "./config";
import { isEmpty } from "./http";
import { apiAsUser } from "./token";
import { MAX_GENRES, type StudioComic, type StudioEpisode, type StudioShort } from "@/lib/studioModel";

// Phase 5: the signed-in creator's own Mafiki, episodes and shorts (the backend's "my-libraries").
// Server-only. Behaviour checked on staging (5 Nov 2026), as a fresh test creator:
// - Any account can use these: there's no separate creator role.
// - Lists take page/limit and answer an empty list with "no record found".
// - A new Mafiki starts with statusId 0 (not published).
// - The episode list has no pages; one episode's own call has them as comicImages, each with is_lock.
// - Cover, banner, episode pages and short videos are sent as links: the live site uploads the files
//   to Cloudinary from its own server first. Only an episode's thumbnail is sent as a file.
// - Shorts: none on the test account yet, so their fields follow the public shorts (video in `upload`)
//   and the API examples (visibility "public"/"private"); not checked.

type Raw = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const genreNames = (genres: unknown) =>
  (Array.isArray(genres) ? genres : [])
    .map((g: Raw) => str((g.genre as Raw | undefined)?.name ?? g.name))
    .filter(Boolean)
    .slice(0, MAX_GENRES);

export const studioLive = () => isLive("studio") && isLive("accounts");

// Every page of a "my-libraries" list, or null if the backend couldn't be read.
async function allPages(path: string, key: string): Promise<Raw[] | null> {
  const rows: Raw[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await apiAsUser<Record<string, unknown>>(`${path}?page=${page}&limit=50`, { revalidate: false });
    if (!result.ok) return isEmpty(result) ? rows : null;
    rows.push(...((result.data[key] as Raw[] | undefined) ?? []));
    const pagination = result.data.pagination as Raw | undefined;
    if (!pagination || page >= num(pagination.totalPages)) break;
  }
  return rows;
}

function toStudioEpisode(raw: Raw, pages: Raw[] | null): StudioEpisode {
  const images = pages ?? [];
  const locked = images.flatMap((image, i) => (num(image.isLock) === 1 ? [i + 1] : []));
  return {
    id: String(num(raw.id)),
    title: str(raw.title) || str(raw.slug),
    pages: images.map((image) => str(image.image)).filter(Boolean),
    ads: num(raw.isMonetized) === 1 && str(raw.monetizationType) === "ads",
    lockedPanels: locked,
    thumbnail: str(raw.thumbnail) || null,
    // The backend has no drafts or scheduling: an episode is out as soon as it's added.
    status: "published",
    publishAt: null,
    pagesKnown: pages !== null,
  };
}

function toStudioComic(raw: Raw, episodes: StudioEpisode[]): StudioComic {
  const published = num(raw.statusId) !== 0;
  return {
    id: str(raw.uuid),
    apiId: num(raw.id),
    title: str(raw.title),
    synopsis: str(raw.description),
    cover: str(raw.coverImage) || null,
    banner: str(raw.backgroundImage) || null,
    genres: genreNames(raw.genres),
    schedule: str(raw.updateDays) || null,
    status: !published ? "draft" : str(raw.status) === "COMPLETED" ? "completed" : "published",
    episodes,
    reads: num(raw.viewsCount ?? raw.viewCount),
    likes: num(raw.likesCount),
    updatedAt: str(raw.updatedAt) || str(raw.createdAt) || new Date().toISOString(),
    live: published,
  };
}

function toStudioShort(raw: Raw, comicUuidById: Map<number, string>): StudioShort {
  const comicId = num(raw.comicId);
  const published = num(raw.statusId) !== 0 && str(raw.visibility) !== "private";
  return {
    id: str(raw.uuid),
    apiId: num(raw.id),
    title: str(raw.title),
    caption: str(raw.description),
    video: str(raw.upload) || str(raw.videoLink) || null,
    cover: str(raw.coverImage) || null,
    durationSeconds: null,
    genres: genreNames(raw.genres),
    linkedComicId: comicId ? comicUuidById.get(comicId) ?? null : null,
    allowComments: true,
    status: published ? "published" : "draft",
    publishAt: null,
    views: num(raw.viewsCount ?? raw.viewCount),
    likes: num(raw.likesCount),
    updatedAt: str(raw.updatedAt) || str(raw.createdAt) || new Date().toISOString(),
    live: published,
  };
}

// The creator's Mafiki with their episodes, and their shorts. `withPages`: the one episode (backend id)
// whose pages are needed, for the episode editor. Null when the backend couldn't be read.
export async function getMyStudio(withPages?: string | null): Promise<{ comics: StudioComic[]; shorts: StudioShort[] } | null> {
  const [rawComics, rawShorts] = await Promise.all([allPages("/my-libraries/comics", "comics"), allPages("/my-libraries/shorts", "shorts")]);
  if (!rawComics || !rawShorts) return null;

  const comics = await Promise.all(
    rawComics.map(async (raw) => {
      const id = num(raw.id);
      const rawEpisodes = (await allPages(`/my-libraries/chapters/${id}/pull/all`, "episodes")) ?? [];
      rawEpisodes.sort((a, b) => num(a.episodeNumber) - num(b.episodeNumber));
      const episodes = await Promise.all(
        rawEpisodes.map(async (episode) => {
          if (withPages !== String(num(episode.id))) return toStudioEpisode(episode, null);
          const full = await apiAsUser<Raw>(`/my-libraries/chapters/${num(episode.id)}/comic/${id}/get`, { revalidate: false });
          return toStudioEpisode(episode, full.ok ? ((full.data.comicImages as Raw[] | undefined) ?? []) : null);
        })
      );
      return toStudioComic(raw, episodes);
    })
  );

  const comicUuidById = new Map(rawComics.map((raw) => [num(raw.id), str(raw.uuid)]));
  return { comics, shorts: rawShorts.map((raw) => toStudioShort(raw, comicUuidById)) };
}

// Step 2: saving a Mafiki's details, publishing and deleting. Behaviour checked on staging (5 Nov):
// - Update is a form POST with ?_method=PATCH; it replaces the genres with the ones sent.
// - Publish and unpublish are one toggle that flips statusId (1 published, 0 not) and says which way
//   in its message, so we read the current state first and only toggle when it differs.
// - "Completed" is the comic's status field (COMPLETED / ONGOING), set through the update.

export type StudioWriteResult = { ok: true } | { ok: false; message: string };

const failed = (message = "That didn't save. Please try again.") => ({ ok: false as const, message });
const isLink = (value: string | null) => !!value && /^https:\/\//.test(value);

export type ComicDetailsInput = {
  title: string;
  synopsis: string;
  genres: string[];
  schedule: string | null;
  cover: string | null;
  banner: string | null;
  completed: boolean;
};

export async function updateMyComic(apiId: number, details: ComicDetailsInput, genreIds: Map<string, number>): Promise<StudioWriteResult> {
  if (!studioLive()) return failed("The Studio isn't connected yet.");
  // New images would need uploading first (see the notes at the top).
  if (!isLink(details.cover) || (details.banner && !isLink(details.banner))) return failed("Changing the cover or banner isn't connected yet.");
  const ids = details.genres.map((name) => genreIds.get(name)).filter((id): id is number => id != null);
  if (!details.title.trim() || ids.length === 0) return failed("A title and at least one genre are needed.");

  const form = new FormData();
  form.append("title", details.title.trim());
  form.append("description", details.synopsis.trim());
  form.append("coverImage", details.cover!);
  form.append("backgroundImage", details.banner || details.cover!);
  form.append("status", details.completed ? "COMPLETED" : "ONGOING");
  form.append("updateDays", details.schedule ?? "");
  form.append("socialMediaHandle", "");
  ids.forEach((id, i) => form.append(`genreId[${i}]`, String(id)));
  const result = await apiAsUser(`/my-libraries/comics/${apiId}/update?_method=PATCH`, { method: "POST", body: form, revalidate: false });
  return result.ok ? { ok: true } : failed(result.message);
}

export async function setMyComicPublished(apiId: number, publish: boolean): Promise<StudioWriteResult> {
  if (!studioLive()) return failed("The Studio isn't connected yet.");
  const current = await apiAsUser<Raw>(`/my-libraries/comics/${apiId}/get`, { revalidate: false });
  if (!current.ok) return failed(current.message);
  if ((num(current.data.statusId) !== 0) === publish) return { ok: true };
  const result = await apiAsUser(`/my-libraries/comics/${apiId}/toggle`, { method: "PUT", revalidate: false });
  return result.ok ? { ok: true } : failed(result.message);
}

export async function deleteMyComic(apiId: number): Promise<StudioWriteResult> {
  if (!studioLive()) return failed("The Studio isn't connected yet.");
  const result = await apiAsUser(`/my-libraries/comics/${apiId}/delete`, { method: "DELETE", revalidate: false });
  return result.ok ? { ok: true } : failed(result.message);
}

export async function deleteMyEpisode(comicApiId: number, episodeId: number): Promise<StudioWriteResult> {
  if (!studioLive()) return failed("The Studio isn't connected yet.");
  const result = await apiAsUser(`/my-libraries/chapters/${episodeId}/comic/${comicApiId}/delete`, { method: "DELETE", revalidate: false });
  return result.ok ? { ok: true } : failed(result.message);
}
