import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { LibraryView, LIBRARY_TABS, SAVED_SORTS, type FollowedCreator } from "@/components/library/LibraryView";
import { getCatalogue, getCreatorsDirectory, getShortsPageData, getSiteStats } from "@/lib/api/client";
import { pageParam } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Your library | Toon Central",
  description: "Your saved Mafiki, reading history, saved shorts and the creators you follow.",
  robots: { index: false },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// What's in the library lives in the browser for now (see src/lib/mockSession.ts), so the server sends
// the catalogue and the page picks the reader's saved items out of it.
export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const query = await searchParams;
  const tab = LIBRARY_TABS.find((t) => t.value === one(query.tab))?.value ?? "saved";
  const sort = SAVED_SORTS.find((s) => s.value === one(query.sort))?.value ?? "recent";

  const [comics, shortsData, creators, stats] = await Promise.all([
    getCatalogue(),
    getShortsPageData(null, "popular"),
    getCreatorsDirectory("popular"),
    getSiteStats(),
  ]);

  // Only what the Following tab shows, not every creator's full catalogue.
  const following: FollowedCreator[] = creators.map(({ creator, comics, shorts, stats }) => ({
    creator,
    series: comics.length,
    shorts: shorts.length,
    lastActive: stats.lastActive,
    latest: [...comics]
      .sort((a, b) => (b.lastEpisodeAt ?? "").localeCompare(a.lastEpisodeAt ?? ""))
      .slice(0, 3)
      .map((c) => ({ uuid: c.uuid, title: c.title, coverImage: c.coverImage })),
  }));

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />
        <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-80" />

        <div className="relative mx-auto px-6 pb-16 pt-10 md:px-8 lg:px-10">
          <LibraryView
            tab={tab}
            sort={sort}
            page={pageParam(query.page)}
            comics={comics}
            shorts={shortsData.shorts.filter((s) => !s.isSponsored)}
            creators={following}
          />
        </div>

        <Footer stats={stats} />
      </main>
    </div>
  );
}
