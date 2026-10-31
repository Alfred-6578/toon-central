import { getCatalogue, getCreatorsDirectory, getGenres, getHomeFeed, getShorts, getTopCarousel, linkShortsToComics } from "@/lib/api/client";
import { DEMO_CREATOR } from "@/lib/studioServer";
import type { Comic, CreatorPageData, Genre, Short } from "@/lib/api/types";
import { interleaveByCreator } from "@/lib/shortsFeed";

// Mood collections built from genre tags. Action is left out on purpose: almost every comic has it.
export const VIBES = [
  { id: "heroes", tone: "sun", title: "Heroes & powers", blurb: "Capes, curses and people who refuse to stay down.", genres: ["Superhero", "Supernatural", "Martial Arts", "Military"] },
  { id: "myths", tone: "mint", title: "Myths & legends", blurb: "Old gods, lost kingdoms and worlds next door.", genres: ["Fantasy", "Historical", "Epic Fantasy", "Isekai/Ojemba", "Urban Fantasy", "Anthology"] },
  { id: "love", tone: "paper", title: "Love & drama", blurb: "Crushes, rivals, families and everything in between.", genres: ["Romance", "Drama", "Slice of Life", "Teen", "Coming of Age", "Heartwarming", "School Life", "Fantasy Romance", "Comedy"] },
  { id: "dark", tone: "mint", title: "Dark & twisted", blurb: "Read with the lights on.", genres: ["Horror", "Thriller", "Mystery", "Crime", "Tragedy", "Psychological"] },
] as const;

export type Vibe = (typeof VIBES)[number];

// A section needs at least this many items to show; thinner ones hide until the catalogue fills them.
export const MIN_ITEMS = 3;
// Comics in Discover's banner (alongside its promo slides).
const BANNER_COMICS = 6;
const POPULAR_INDIES = 10;
const SECTION_SIZE = 5;

export const inVibe = (vibe: Vibe, comic: Comic) => comic.genres.some((g) => (vibe.genres as readonly string[]).includes(g));

export async function getVibe(id: string) {
  const vibe = VIBES.find((v) => v.id === id);
  if (!vibe) return null;
  const comics = (await getCatalogue()).filter((c) => inVibe(vibe, c)).sort((a, b) => b.views - a.views);
  return { vibe, comics };
}

export type DiscoverData = {
  vibes: { vibe: Vibe; count: number; covers: Comic[] }[];
  gems: Comic[];
  nowShowing: Short[];
  newest: Comic[];
  completed: Comic[];
  genres: Genre[];
  creators: CreatorPageData[];
  everything: string[];
  // The live site's main-menu strip (its top carousel), and one Original to feature in the banners.
  carousel: Comic[];
  // Trailers for carousel comics (comic uuid → video URL): the animated short linked to the comic.
  // Creators' own trailer uploads join these in the browser (DiscoverCarousel).
  trailers: Record<string, string>;
  // The Studio demo creator's comics: a trailer uploaded in Creator Studio (stored in the browser)
  // brings its comic to the front of the strip.
  studioComics: Comic[];
  // Popular by Indies: the most-read Mafiki from independent creators (not Originals) with banner art.
  popular: Comic[];
  // Comics to feature in the banner: the live site's "Popular by ToonCentral" picks, with banner art.
  featured: Comic[];
};

export async function getDiscoverData(): Promise<DiscoverData> {
  const [catalogue, shorts, feed, genres, creators] = await Promise.all([
    getCatalogue(),
    getShorts(),
    getHomeFeed(),
    getGenres(),
    getCreatorsDirectory("active"),
  ]);
  const top = await getTopCarousel();
  const topTen = new Set(feed.trending.slice(0, 10).map((c) => c.uuid));

  // Each comic appears in at most one list section. Scarce lists claim first, so they still fill.
  const used = new Set<string>();
  const claim = (comics: Comic[]) => {
    const picked = comics.filter((c) => !used.has(c.uuid)).slice(0, SECTION_SIZE);
    picked.forEach((c) => used.add(c.uuid));
    return picked.length >= MIN_ITEMS ? picked : [];
  };

  const completed = claim(catalogue.filter((c) => c.status === "COMPLETED").sort((a, b) => b.views - a.views));
  // Loved by the few who found them: likes per read, outside the Top 10.
  const gems = claim(
    catalogue.filter((c) => !topTen.has(c.uuid) && c.views > 0).sort((a, b) => b.likes / b.views - a.likes / a.views)
  );
  const newest = claim([...catalogue].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")));

  // Vibe tiles are doorways, not lists, so their covers don't count against the no-repeat rule.
  const vibes = VIBES.map((vibe) => {
    const matches = catalogue.filter((c) => inVibe(vibe, c)).sort((a, b) => b.views - a.views);
    return { vibe, count: matches.length, covers: matches.slice(0, 3) };
  }).filter((v) => v.count >= MIN_ITEMS);

  const nowShowing = interleaveByCreator(linkShortsToComics(shorts.filter((s) => !s.isSponsored), catalogue));


  const people = creators.filter((c) => !c.isOfficial).slice(0, 3);

  // A comic with an animated short linked to it (real links only) uses the short as its trailer, and
  // comics with trailers lead the main-menu strip so they're seen.
  const trailers = Object.fromEntries(
    linkShortsToComics(shorts, catalogue).flatMap((s) => (s.linkedComic && !s.linkedComic.demo && s.video ? [[s.linkedComic.uuid, s.video]] : []))
  );
  const strip = top.length ? top : [...catalogue].sort((a, b) => b.views - a.views).slice(0, 10);
  const withTrailers = catalogue.filter((c) => trailers[c.uuid]);
  const carousel = [...withTrailers, ...strip.filter((c) => !trailers[c.uuid])];

  return {
    vibes,
    gems,
    nowShowing: nowShowing.length >= MIN_ITEMS ? nowShowing : [],
    newest,
    completed,
    genres,
    creators: people,
    everything: catalogue.map((c) => c.uuid),
    carousel,
    trailers,
    popular: catalogue
      .filter((c) => !c.isOriginal && c.backgroundImage)
      .sort((a, b) => b.views - a.views)
      .slice(0, POPULAR_INDIES),
    studioComics: catalogue.filter((c) => c.creator.username.toLowerCase() === DEMO_CREATOR),
    featured: [...new Map([...feed.popularByToonCentral, ...catalogue.filter((c) => c.isOriginal)].map((c) => [c.uuid, c])).values()]
      .filter((c) => c.backgroundImage)
      .slice(0, BANNER_COMICS),
  };
}
