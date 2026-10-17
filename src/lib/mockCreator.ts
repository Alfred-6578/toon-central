"use client";

import { useLocalValue } from "@/lib/localValue";

// Stand-in for a real creator account: set by the "Become a creator" step, kept in this browser.
export type CreatorProfile = {
  name: string;
  handle: string;
  makes: ("comics" | "shorts")[];
  bio: string;
  // Filled in from the Studio's Profile page; optional so older saves still load.
  tagline?: string;
  avatar?: string | null;
  banner?: string | null;
  genres?: string[];
  socials?: { platform: SocialPlatform; handle: string }[];
};

export const SOCIAL_PLATFORMS = ["instagram", "x", "tiktok", "youtube", "facebook"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const KEY = "tc-mock-creator";

// `key` lets the Studio's "established" demo keep its own profile apart from the reader's.
export function useMockCreator(key = KEY) {
  const [raw, setRaw] = useLocalValue(key, "");
  let profile: CreatorProfile | null = null;
  try {
    profile = raw ? (JSON.parse(raw) as CreatorProfile) : null;
  } catch {
    profile = null;
  }
  return {
    profile,
    become: (next: CreatorProfile) => setRaw(JSON.stringify(next)),
    reset: () => setRaw(""),
  };
}
