export type Creator = {
  // The backend's user id; following a creator needs it.
  id?: number;
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
  // When the comic itself was first published.
  createdAt: string | null;
  isNew: boolean;
  hasNewEpisode: boolean;
  isOriginal: boolean;
  genres: string[];
  creator: Creator;
  // Public promo handle the creator supplied for this comic, e.g. "4_7studios@instagram".
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
  // Live episodes only: the backend's episode id (the reader fetches pages by it), the creator's
  // episode thumbnail and how many pages it has.
  id?: number;
  thumbnail?: string | null;
  pages?: number;
};

// "live" when episodes came from the API; "placeholder" when generated from the chapter count;
// "unknown" when we have no chapter count to build from; "loading" while the browser fetches the live list.
export type EpisodesSource = "live" | "placeholder" | "unknown" | "loading";

export type ComicPageData = {
  comic: Comic;
  episodes: Episode[];
  episodesSource: EpisodesSource;
  moreFromCreator: Comic[];
  similar: Comic[];
  // "backend": the API's you-may-also-like list; "genres": ours, from shared genres, when it had none.
  similarFrom: "backend" | "genres";
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
  stats: { comics: number; reads: number; likes: number; chapters: number | null; shortViews: number; lastActive: string | null };
};
