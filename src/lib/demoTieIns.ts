import type { Comic, Short } from "@/lib/api/types";

// DEMO ONLY. In the real data just one short (AfriDivaz) is linked to a comic. To show the client how
// tie-ins look across a feed, these pairings are invented by matching themes, and every one is
// marked `demo` so the player stamps it "Demo link". Only applied when ?tieins=demo is on.
const DEMO_TIE_INS: Record<string, string> = {
  // Engagement Issues (Drama, Romance) → Head over heels (romantic comedy)
  "17c37830-bd67-49a7-bb11-6fa444a77a57": "e3f5816a-3bcc-4edd-b9eb-500fd38b39c0",
  // Take care of our women (Drama, Crime, Tragedy) → WIDOW'S GUILT (Mystery, Crime, Tragedy)
  "c05571ad-81b4-43b8-b660-c8c1bcbfd408": "4e23fe61-2063-4f2d-82ff-1df93875c926",
};

export function applyDemoTieIns(shorts: Short[], comics: Comic[]): Short[] {
  const byUuid = new Map(comics.map((c) => [c.uuid, c]));
  return shorts.map((s) => {
    const comic = byUuid.get(DEMO_TIE_INS[s.uuid]);
    if (s.linkedComic || !comic) return s;
    return { ...s, linkedComic: { uuid: comic.uuid, title: comic.title, coverImage: comic.coverImage, demo: true } };
  });
}
