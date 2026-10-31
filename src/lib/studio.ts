import type { Comic, Short } from "@/lib/api/types";

// Studio sections. `ready: false` ones show in the sidebar as coming next instead of linking to a 404.
export const STUDIO_PAGES = [
  { id: "overview", label: "Overview", href: "/creator/dashboard", ready: true },
  { id: "comics", label: "Mafiki", href: "/creator/comics", ready: true },
  { id: "shorts", label: "Shorts", href: "/creator/shorts", ready: true },
  { id: "earnings", label: "Earnings", href: "/creator/earnings", ready: true },
  { id: "profile", label: "Profile", href: "/creator/profile", ready: true },
] as const;
export type StudioPageId = (typeof STUDIO_PAGES)[number]["id"];

export const studioPage = (id: StudioPageId) => STUDIO_PAGES.find((p) => p.id === id)!;

// The "established creator" demo: a real creator's public comics and shorts. Anything we can't know
// from public data (followers, earnings, daily reads) is generated and stamped "Sample" on the page.
export type StudioDemo = {
  name: string;
  handle: string;
  comics: Comic[];
  shorts: Short[];
  sample: { followers: number; earningsNaira: number; dailyReads: number[] };
};

// Deterministic, so the sample chart doesn't change on every render.
export function sampleDailyReads(totalReads: number, days = 30) {
  const base = totalReads / 365;
  return Array.from({ length: days }, (_, i) => {
    const wave = 1 + 0.35 * Math.sin(i / 2.2) + 0.2 * Math.sin(i * 1.7);
    const weekend = i % 7 === 5 || i % 7 === 6 ? 1.3 : 1;
    return Math.max(0, Math.round(base * wave * weekend));
  });
}
