import { getCatalogue, getCreatorsDirectory, getGenres, getHomeFeed, getShorts, linkShortsToComics } from "@/lib/api/client";
import type { Comic, CreatorPageData, Genre, Short } from "@/lib/api/types";
import { creatorHref, genreHref } from "@/lib/format";
import { interleaveByCreator } from "@/lib/shortsFeed";

// Mood collections built from genre tags. Action is left out on purpose: almost every series has it.
export const VIBES = [
  { id: "heroes", tone: "sun", title: "Heroes & powers", blurb: "Capes, curses and people who refuse to stay down.", genres: ["Superhero", "Supernatural", "Martial Arts", "Military"] },
  { id: "myths", tone: "mint", title: "Myths & legends", blurb: "Old gods, lost kingdoms and worlds next door.", genres: ["Fantasy", "Historical", "Epic Fantasy", "Isekai/Ojemba", "Urban Fantasy", "Anthology"] },
  { id: "love", tone: "paper", title: "Love & drama", blurb: "Crushes, rivals, families and everything in between.", genres: ["Romance", "Drama", "Slice of Life", "Teen", "Coming of Age", "Heartwarming", "School Life", "Fantasy Romance", "Comedy"] },
  { id: "dark", tone: "mint", title: "Dark & twisted", blurb: "Read with the lights on.", genres: ["Horror", "Thriller", "Mystery", "Crime", "Tragedy", "Psychological"] },
] as const;

export type Vibe = (typeof VIBES)[number];

// A section needs at least this many items to show; thinner ones hide until the catalogue fills them.
export const MIN_ITEMS = 3;
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
  quickLinks: { label: string; href: string }[];
  everything: string[];
};

export async function getDiscoverData(): Promise<DiscoverData> {
  const [catalogue, shorts, feed, genres, creators] = await Promise.all([
    getCatalogue(),
    getShorts(),
    getHomeFeed(),
    getGenres(),
    getCreatorsDirectory("active"),
  ]);
  const topTen = new Set(feed.trending.slice(0, 10).map((c) => c.uuid));

  // Each series appears in at most one list section. Scarce lists claim first, so they still fill.
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
  // Search shortcuts: a few genres plus the most recently active creators.
  const quickLinks = [
    ...["Fantasy", "Romance", "Supernatural", "Sports"].map((g) => ({ label: g, href: genreHref(g) })),
    ...people.slice(0, 2).map((c) => ({ label: c.creator.username, href: creatorHref(c.creator.username) })),
  ];

  return {
    vibes,
    gems,
    nowShowing: nowShowing.length >= MIN_ITEMS ? nowShowing : [],
    newest,
    completed,
    genres,
    creators: people,
    quickLinks,
    everything: catalogue.map((c) => c.uuid),
  };
}
