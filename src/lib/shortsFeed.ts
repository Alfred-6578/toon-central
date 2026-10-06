import type { Short } from "@/lib/api/types";
import { genreSlug } from "@/lib/format";

// Mix creators so one prolific animator doesn't fill a run: round-robin, smallest catalogue first,
// each creator's own shorts in most-watched order.
export function interleaveByCreator(shorts: Short[]): Short[] {
  const groups = new Map<string, Short[]>();
  [...shorts]
    .sort((a, b) => b.views - a.views)
    .forEach((s) => groups.set(s.creator.username, [...(groups.get(s.creator.username) ?? []), s]));
  const queues = [...groups.values()].sort((a, b) => a.length - b.length);
  const out: Short[] = [];
  while (queues.some((q) => q.length)) queues.forEach((q) => q.length && out.push(q.shift()!));
  return out;
}

// Where ads sit in the feed: never first, then spaced out.
const FIRST_AD_AT = 3;
const AD_EVERY = 8;

// The /shorts feed order: stories interleaved by creator, ads slotted in. A genre feed has no ads.
export function buildShortsFeed(shorts: Short[], genre: string | null): Short[] {
  const stories = shorts.filter((s) => !s.isSponsored && (!genre || s.genres.some((g) => genreSlug(g) === genre)));
  const feed = interleaveByCreator(stories);
  if (genre) return feed;

  shorts
    .filter((s) => s.isSponsored)
    .forEach((ad, i) => feed.splice(Math.min(FIRST_AD_AT + i * AD_EVERY, feed.length), 0, ad));
  return feed;
}
