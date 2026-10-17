import { getCreatorPageData, getGenres } from "@/lib/api/client";
import { resolveDesign } from "@/lib/designOptions";
import { fromLiveComic, fromLiveShort, type StudioComic, type StudioMode, type StudioShort } from "@/lib/studioModel";

// The creator used for the "established" demo: real public comics and shorts.
export const DEMO_CREATOR = "47studios";

type Query = Record<string, string | string[] | undefined>;

// What every Studio page needs from the server: which demo mode, its real comics, and the genre list.
export async function getStudioContext(query: Query) {
  const design = resolveDesign(query);
  const mode: StudioMode = design.studio === "established" ? "established" : "new";
  const [data, genres] = await Promise.all([mode === "established" ? getCreatorPageData(DEMO_CREATOR) : null, getGenres()]);
  const seeds: StudioComic[] = data ? data.comics.map(fromLiveComic) : [];
  const comicUuidById = new Map((data?.comics ?? []).map((c) => [c.id, c.uuid]));
  const shortSeeds: StudioShort[] = data ? data.shorts.map((s) => fromLiveShort(s, comicUuidById)) : [];
  return { design, mode, seeds, shortSeeds, genres: genres.map((g) => g.name), demoData: data };
}
