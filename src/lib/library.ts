import type { Creator, CreatorPageData } from "@/lib/api/types";

// Shared by the /library page (server) and its view (client).
export const LIBRARY_TABS = [
  { value: "saved", label: "Saved Mafiki" },
  { value: "history", label: "History" },
  { value: "shorts", label: "Saved shorts" },
  { value: "following", label: "Following" },
] as const;
export type LibraryTab = (typeof LIBRARY_TABS)[number]["value"];

export const SAVED_SORTS = [
  { value: "recent", label: "Recently saved" },
  { value: "updated", label: "Last updated" },
  { value: "az", label: "A–Z" },
] as const;
export type SavedSort = (typeof SAVED_SORTS)[number]["value"];

export type FollowedCreator = {
  creator: Creator;
  comics: number;
  shorts: number;
  lastActive: string | null;
  latest: { uuid: string; title: string; coverImage: string }[];
};

// Only what the Following lists show, not every creator's full catalogue.
export function toFollowedCreators(creators: CreatorPageData[]): FollowedCreator[] {
  return creators.map(({ creator, comics, shorts, stats }) => ({
    creator,
    comics: comics.length,
    shorts: shorts.length,
    lastActive: stats.lastActive,
    latest: [...comics]
      .sort((a, b) => (b.lastEpisodeAt ?? "").localeCompare(a.lastEpisodeAt ?? ""))
      .slice(0, 3)
      .map((c) => ({ uuid: c.uuid, title: c.title, coverImage: c.coverImage })),
  }));
}
