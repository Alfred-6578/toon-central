import type { Comic, Short } from "@/lib/api/types";

export type LogEntry =
  | { kind: "episode"; date: string; comic: Comic }
  | { kind: "short"; date: string; short: Short };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Dates arrive as "2026-08-04 02:54:05" / ISO strings. Read the parts directly rather than through
// Date, so server and browser can't disagree on the day because of time zones.
export const dateParts = (date: string) => {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  return { year, month: MONTHS[month - 1], day };
};

// Comic episodes and shorts merged into one feed, newest first. Ads are left out: they aren't releases.
export function buildReleaseLog(comics: Comic[], shorts: Short[], limit = 8): LogEntry[] {
  const entries: LogEntry[] = [
    ...comics.filter((c) => c.lastEpisodeAt).map((comic) => ({ kind: "episode" as const, date: comic.lastEpisodeAt!, comic })),
    ...shorts.filter((s) => s.createdAt && !s.isSponsored).map((short) => ({ kind: "short" as const, date: short.createdAt!, short })),
  ];
  return entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
