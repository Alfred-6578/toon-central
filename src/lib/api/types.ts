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
  isNew: boolean;
  hasNewEpisode: boolean;
  isOriginal: boolean;
  genres: string[];
  creator: Creator;
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
  linkedComic: { uuid: string; title: string } | null;
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
