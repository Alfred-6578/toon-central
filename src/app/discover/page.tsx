import type { Metadata } from "next";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { SurpriseMe } from "@/components/discover/DiscoverControls";
import { DiscoverCarousel } from "@/components/discover/DiscoverCarousel";
import { NowShowing } from "@/components/discover/NowShowing";
import { PopularStrip } from "@/components/discover/PopularStrip";
import { PromoBanners } from "@/components/discover/PromoBanners";
import { VibeTiles } from "@/components/discover/VibeTiles";
import { GenreStrip } from "@/components/genre/GenreStrip";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { ComicGrid } from "@/components/ui/ComicGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getSiteStats } from "@/lib/api/client";
import { getDiscoverData } from "@/lib/discover";

export const metadata: Metadata = {
  title: "Discover Mafiki | Toon Central",
  description: "Find your next read: hidden gems, new Mafiki, finished stories and animated shorts from African creators.",
};

function Note({ children }: { children: React.ReactNode }) {
  return <span className="pb-0.5 text-sm text-slate-400">{children}</span>;
}

export default async function DiscoverPage() {
  const [data, stats] = await Promise.all([getDiscoverData(), getSiteStats()]);
  const { vibes, gems, nowShowing, newest, completed, genres, creators, everything, carousel, trailers, studioComics, popular, featured } = data;

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-[700px]" />
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />

        <div className="px-6 pt-8 md:px-8 lg:px-10 lg:pt-10">
          <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">Discover</h1>
        </div>

        {/* The live site's main-menu strip, right under the title. */}
        <DiscoverCarousel comics={carousel} trailers={trailers} studioComics={studioComics} />

        <div className="mx-auto px-6 md:px-8 lg:px-10">
          {/* The nav already has search; the client's mock opens on the vibes, then the banner. */}

          {/* 2. Pick a vibe */}
          {vibes.length > 0 && (
            <section className="mt-10">
              <SectionHeader title="Pick a vibe" action={null} />
              <VibeTiles vibes={vibes} />
            </section>
          )}

          <PromoBanners featured={featured} />


          {/* 3. Hidden gems */}
          {gems.length > 0 && (
            <section className="mt-16">
              <SectionHeader title="Hidden gems" action={null}>
                <Note>Loved by the few who found them</Note>
              </SectionHeader>
              <ComicGrid comics={gems} />
            </section>
          )}

          {/* Popular by Indies: the most-read independent Mafiki, in the live site's wide banner cards. */}
          {popular.length > 0 && <PopularStrip comics={popular} />}

          {/* 4. Now Showing (shorts) */}
          {nowShowing.length > 0 && <NowShowing shorts={nowShowing} />}

          {/* 5. New on Toon Central */}
          {newest.length > 0 && (
            <section className="mt-16">
              <SectionHeader title="New on Toon Central" action={null}>
                <Note>The newest Mafiki, not just new episodes</Note>
              </SectionHeader>
              <ComicGrid comics={newest} />
            </section>
          )}

          {/* 6. Read it start to finish */}
          {completed.length > 0 && (
            <section className="mt-16">
              <SectionHeader title="Read it start to finish" action={null}>
                <Note>Every episode is out</Note>
              </SectionHeader>
              <ComicGrid comics={completed} />
            </section>
          )}

          {/* 7. Browse by genre */}
          <section className="mt-16">
            <SectionHeader title="Browse by genre" action={`All ${genres.length} genres`} href="/genres" />
            <GenreStrip genres={genres} current={-1} />
          </section>

          {/* 8. Creators to follow */}
          {creators.length > 0 && (
            <section className="mt-16">
              <SectionHeader title="Creators to follow" action="All creators" href="/creators">
                <Note>Recently active</Note>
              </SectionHeader>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {creators.map((creator) => (
                  <CreatorCard key={creator.creator.username} data={creator} />
                ))}
              </div>
            </section>
          )}

          {/* 9. Surprise me */}
          <section className="mb-20 mt-20 border-2 border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-4xl uppercase leading-none text-white sm:text-5xl">Still can&apos;t decide?</p>
            <p className="mt-3 text-sm text-slate-400">Let us pick one of {everything.length} Mafiki for you.</p>
            <div className="mt-7">
              <SurpriseMe uuids={everything} />
            </div>
          </section>
        </div>

        <Footer stats={stats} />
      </main>
    </div>
  );
}
