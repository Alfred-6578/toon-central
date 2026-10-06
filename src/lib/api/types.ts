export type Creator = {
  username: string;
  photo: string | null;
};

export type Comic = {
  id: number;
  uuid: string;
  title: string;
  description: string;
  coverImage: string;
  backgroundImage: string;
  status: string;
  updateDays: string | null;
  views: number;
  likes: number;
  // Only some endpoints send this (currently /home's indie_comics); null when unknown.
  episodes: number | null;
  lastEpisodeAt: string | null;
  // When the series itself was first published.
  createdAt: string | null;
  isNew: boolean;
  hasNewEpisode: boolean;
  isOriginal: boolean;
  genres: string[];
  creator: Creator;
  // Public promo handle the creator supplied for this series, e.g. "4_7studios@instagram".
  socialHandle: string | null;
};

export type Short = {
  id: number;
  uuid: string;
  title: string;
  description: string;
  video: string;
  coverImage: string;
  createdAt: string | null;
  views: number;
  likes: number;
  genres: string[];
  creator: Creator;
  comicId: number | null;
  // Filled in on the page when comicId matches a comic we have (e.g. the AFRI DIVAZ short).
  // `demo` marks an invented pairing (see src/lib/demoTieIns.ts), shown with a "Demo link" stamp.
  linkedComic: { uuid: string; title: string; coverImage: string; demo?: boolean } | null;
  // No API flag yet: inferred from the posting account (see normalize.ts).
  isSponsored: boolean;
};

export type Genre = {
  id: number;
  name: string;
  slug: string;
};

export type HomeFeed = {
  carousel: Comic[];
  popularByToonCentral: Comic[];
  trending: Comic[];
  recentUploads: Comic[];
  indieComics: Comic[];
};

export type Episode = {
  number: number;
  title: string;
  publishedAt: string | null;
  locked: boolean;
};

export type ComicPageData = {
  comic: Comic;
  episodes: Episode[];
  // "live" when episodes came from the API; "placeholder" when generated from the chapter count;
  // "unknown" when we have no chapter count to build from.
  episodesSource: "live" | "placeholder" | "unknown";
  moreFromCreator: Comic[];
  similar: Comic[];
  shorts: Short[];
};

export type SocialLink = { handle: string; platform: string | null; url: string | null };

export type CreatorPageData = {
  creator: Creator;
  isOfficial: boolean;
  comics: Comic[];
  shorts: Short[];
  genres: string[];
  socials: SocialLink[];
  stats: { series: number; reads: number; likes: number; chapters: number | null; shortViews: number; lastActive: string | null };
};
