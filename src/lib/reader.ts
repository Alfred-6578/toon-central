import { FREE_EPISODES } from "@/lib/api/client";
import type { Comic } from "@/lib/api/types";
import { cloudinaryTransform } from "@/lib/format";

// Live-site rule: free episodes read in full; Premium episodes show a preview of their first pages.
export const PAGES_PER_EPISODE = 10;
export const PREVIEW_PAGES = 5;
// How many degraded pages to show under the paywall: enough to tease, not worth sending more.
const TEASER_PAGES = 2;

export type ReaderPage = { number: number; src: string; width: number; height: number; degraded: boolean };

export type ReaderEpisode = {
  pages: ReaderPage[];
  // True when the reader hit the paywall: the remaining pages were withheld, not hidden.
  gated: boolean;
  premiumEpisode: boolean;
};

// Stand-in pages until the live API supplies real ones: crops of the series' own cover and banner art,
// shifted per episode so consecutive episodes don't look identical.
const COVER_CROPS = ["north", "center", "south", "north_west", "north_east", "south_west", "south_east"];
const BANNER_CROPS = ["west", "center", "east"];

function standInSource(comic: Comic, episode: number, page: number) {
  const k = episode * 3 + page;
  return page % 3 === 2
    ? { url: comic.backgroundImage, gravity: BANNER_CROPS[k % BANNER_CROPS.length], width: 720, height: 540 }
    : { url: comic.coverImage, gravity: COVER_CROPS[k % COVER_CROPS.length], width: 720, height: 960 };
}

function cleanPage(comic: Comic, episode: number, page: number): ReaderPage {
  const { url, gravity, width, height } = standInSource(comic, episode, page);
  const src = cloudinaryTransform(url, `c_fill,w_${width},h_${height},g_${gravity},q_auto,f_auto`);
  return { number: page, src, width, height, degraded: false };
}

// The only version of a locked page that ever leaves the server: tiny, blurred and watermarked,
// so un-hiding it in the browser reveals nothing. (Production also needs Cloudinary strict/signed
// transformations so the clean variant can't be requested by editing this URL.)
function degradedPage(comic: Comic, episode: number, page: number): ReaderPage {
  const { url, gravity, width, height } = standInSource(comic, episode, page);
  const src = cloudinaryTransform(
    url,
    [
      `c_fill,w_240,h_${Math.round((240 * height) / width)},g_${gravity}`,
      "e_blur:1600",
      "l_text:Arial_20_bold:TOON%20CENTRAL%20PREMIUM,co_white,o_70,c_fit,w_200",
      "fl_layer_apply,g_center",
      "q_auto:low,f_auto",
    ].join("/")
  );
  return { number: page, src, width, height, degraded: true };
}

export function buildEpisode(comic: Comic, episode: number, premiumReader: boolean): ReaderEpisode {
  const premiumEpisode = episode > FREE_EPISODES;
  const gated = premiumEpisode && !premiumReader;
  const readable = gated ? PREVIEW_PAGES : PAGES_PER_EPISODE;

  const pages = Array.from({ length: readable }, (_, i) => cleanPage(comic, episode, i + 1));
  if (gated) {
    for (let i = 0; i < TEASER_PAGES; i++) pages.push(degradedPage(comic, episode, readable + i + 1));
  }
  return { pages, gated, premiumEpisode };
}
