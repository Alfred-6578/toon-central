import { FREE_EPISODES, PREVIEW_PAGES } from "@/lib/rules";
import type { Comic } from "@/lib/api/types";
import { cloudinaryTransform } from "@/lib/format";
import { episodeKey, pageKey, type Unlocks } from "@/lib/session";

// Live-site rule: free episodes read in full; locked episodes show their first pages, and every page
// after that is locked until the reader unlocks it with credits (or has a pass).
export const PAGES_PER_EPISODE = 10;
export { PREVIEW_PAGES };

// Live-site prices, in credits: one page for a day, or the whole episode for good.
export const UNLOCK_PRICES = { page: 10, episode: 50 };
export const PAGE_UNLOCK_MS = 24 * 60 * 60 * 1000;

export type ReaderPage = {
  number: number;
  src: string;
  width: number;
  height: number;
  // Locked: `src` is the blurred, watermarked version; the clean one was never sent.
  degraded: boolean;
  // Unlocked with credits for a limited time (page unlocks): when that access ends.
  unlockedUntil: number | null;
};

export type ReaderEpisode = {
  pages: ReaderPage[];
  lockedCount: number;
  premiumEpisode: boolean;
  // Bought the whole episode.
  ownsEpisode: boolean;
  passActive: boolean;
};

// Stand-in pages until the live API supplies real ones: crops of the comic's own cover and banner art,
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
  return { number: page, src, width, height, degraded: false, unlockedUntil: null };
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
  return { number: page, src, width, height, degraded: true, unlockedUntil: null };
}

// The server decides what each page is. Locked pages are only ever sent degraded; a page goes clean
// once the reader owns the episode or has a page unlock that hasn't expired.
export function buildEpisode(comic: Comic, episode: number, unlocks: Unlocks, now: number, passUntil: number | null = null): ReaderEpisode {
  const premiumEpisode = episode > FREE_EPISODES;
  const ownsEpisode = unlocks[episodeKey(comic.uuid, episode)] === "full";
  // An active pass (e.g. MTN Daily) opens every locked page while it lasts.
  const passActive = passUntil != null && passUntil > now;

  const pages = Array.from({ length: PAGES_PER_EPISODE }, (_, i) => {
    const number = i + 1;
    if (!premiumEpisode || ownsEpisode || passActive || number <= PREVIEW_PAGES) return cleanPage(comic, episode, number);
    const until = unlocks[pageKey(comic.uuid, episode, number)];
    if (typeof until === "number" && until > now) return { ...cleanPage(comic, episode, number), unlockedUntil: until };
    return degradedPage(comic, episode, number);
  });

  return { pages, lockedCount: pages.filter((p) => p.degraded).length, premiumEpisode, ownsEpisode, passActive };
}
