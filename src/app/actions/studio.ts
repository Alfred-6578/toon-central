"use server";

import { updateTag } from "next/cache";
import { getGenres } from "@/lib/api/client";
import { PUBLIC_API_TAG } from "@/lib/api/http";
import * as studio from "@/lib/api/studio";

// The browser's way into the Studio writes (src/lib/api/studio.ts). Each runs as the signed-in creator
// with the token in their httpOnly cookie; the backend only lets them change their own Mafiki. After a
// change the site's cached public data is expired, so the public pages show it on the next visit
// instead of up to 5 minutes later.

const fresh = <T extends { ok: boolean }>(result: T) => {
  if (result.ok) updateTag(PUBLIC_API_TAG);
  return result;
};

const id = (value: unknown) => (Number.isInteger(value) && (value as number) > 0 ? (value as number) : 0);
const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");
const link = (value: unknown) => (typeof value === "string" && value ? value.slice(0, 1000) : null);

export async function saveComicDetailsAction(apiId: number, details: studio.ComicDetailsInput) {
  if (!id(apiId)) return { ok: false as const, message: "That Mafiki couldn't be found." };
  const genreIds = new Map((await getGenres()).map((g) => [g.name, g.id]));
  return fresh(await studio.updateMyComic(
    id(apiId),
    {
      title: text(details?.title, 120),
      synopsis: text(details?.synopsis, 2000),
      genres: Array.isArray(details?.genres) ? details.genres.filter((g): g is string => typeof g === "string").slice(0, 5) : [],
      schedule: text(details?.schedule, 20) || null,
      cover: link(details?.cover),
      banner: link(details?.banner),
      completed: details?.completed === true,
    },
    genreIds
  ));
}

export async function setComicPublishedAction(apiId: number, publish: boolean) {
  return id(apiId) ? fresh(await studio.setMyComicPublished(id(apiId), publish === true)) : { ok: false as const, message: "That Mafiki couldn't be found." };
}

export async function deleteComicAction(apiId: number) {
  return id(apiId) ? fresh(await studio.deleteMyComic(id(apiId))) : { ok: false as const, message: "That Mafiki couldn't be found." };
}

export async function deleteEpisodeAction(comicApiId: number, episodeId: number) {
  return id(comicApiId) && id(episodeId) ? fresh(await studio.deleteMyEpisode(id(comicApiId), id(episodeId))) : { ok: false as const, message: "That episode couldn't be found." };
}
