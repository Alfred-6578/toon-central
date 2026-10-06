"use client";

import { ShortsFeed } from "@/components/home/shorts/ShortsFeed";
import type { Short } from "@/lib/api/types";

const stay = () => {};

// The /shorts page: the feed itself rather than a pop-up, so there's nothing to close.
export function ShortsPageFeed({ shorts, startIndex }: { shorts: Short[]; startIndex: number }) {
  return <ShortsFeed shorts={shorts} startIndex={startIndex} onClose={stay} mode="page" />;
}
