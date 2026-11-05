import { getCreatorPageData, getGenres } from "@/lib/api/client";
import { getMyStudio, studioLive } from "@/lib/api/studio";
import { resolveDesign } from "@/lib/designOptions";
import { fromLiveComic, fromLiveShort, type StudioComic, type StudioMode, type StudioShort } from "@/lib/studioModel";

// The creator used for the "established" demo: real public comics and shorts.
export const DEMO_CREATOR = "47studios";

type Query = Record<string, string | string[] | undefined>;

// What every Studio page needs from the server: which mode, its comics and shorts, and the genre list.
// With the studio area live it's the signed-in creator's own ("live"; `unreadable` if the backend
// didn't answer). `episodeId`: the episode (backend id) whose pages the page needs.
export async function getStudioContext(query: Query, { episodeId }: { episodeId?: string | null } = {}) {
  const design = resolveDesign(query);
  const genres = (await getGenres()).map((g) => g.name);

  if (studioLive()) {
    const mine = await getMyStudio(episodeId);
    return { design, mode: "live" as StudioMode, seeds: mine?.comics ?? [], shortSeeds: mine?.shorts ?? [], genres, demoData: null, unreadable: !mine };
  }

  const mode: StudioMode = design.studio === "established" ? "established" : "new";
  const data = mode === "established" ? await getCreatorPageData(DEMO_CREATOR) : null;
  const seeds: StudioComic[] = data ? data.comics.map(fromLiveComic) : [];
  const comicUuidById = new Map((data?.comics ?? []).map((c) => [c.id, c.uuid]));
  const shortSeeds: StudioShort[] = data ? data.shorts.map((s) => fromLiveShort(s, comicUuidById)) : [];
  return { design, mode, seeds, shortSeeds, genres, demoData: data, unreadable: false };
}
