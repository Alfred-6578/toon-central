"use client";

import { spendCredits } from "@/lib/mockSession";
import { PAGE_UNLOCK_MS, UNLOCK_PRICES } from "@/lib/reader";
import { episodeKey, pageKey, parseUnlocks, UNLOCKS_COOKIE, type Unlocks } from "@/lib/session";

function readCookie(): Unlocks {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${UNLOCKS_COOKIE}=`));
  return parseUnlocks(match?.slice(UNLOCKS_COOKIE.length + 1));
}

// Mock unlock: takes the credits and records the unlock where the reader page (server) can see it.
// The caller then refreshes the page so the server sends the clean pages. Expired page unlocks are
// dropped on each write so the cookie stays small.
export function unlock(uuid: string, episode: number, what: { page: number } | "episode") {
  const now = Date.now();
  const kept = Object.fromEntries(Object.entries(readCookie()).filter(([, v]) => v === "full" || v > now));
  if (what === "episode") kept[episodeKey(uuid, episode)] = "full";
  else kept[pageKey(uuid, episode, what.page)] = now + PAGE_UNLOCK_MS;
  document.cookie = `${UNLOCKS_COOKIE}=${encodeURIComponent(JSON.stringify(kept))}; path=/; max-age=31536000; samesite=lax`;
  spendCredits(what === "episode" ? UNLOCK_PRICES.episode : UNLOCK_PRICES.page);
}
