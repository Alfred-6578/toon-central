import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { TrendingSection } from "@/components/home/TrendingSection";
import { ShortsSection } from "@/components/home/ShortsSection";
import { NewChaptersSection } from "@/components/home/NewChaptersSection";
import { buildReleaseLog } from "@/components/home/latest/releaseLogData";
import { GenresSection } from "@/components/home/GenresSection";
import { OriginalsSection } from "@/components/home/OriginalsSection";
import { IndiesSection } from "@/components/home/IndiesSection";
import { PremiumCTA } from "@/components/home/PremiumCTA";
import { DesignOptions } from "@/components/ui/DesignOptions";
import { getGenreCounts, getGenres, getHomeFeed, getShorts, getTopCarousel, shareEpisodeCounts } from "@/lib/api/client";
import type { Comic } from "@/lib/api/types";
import { resolveDesign } from "@/lib/designOptions";

function uniqueComics(lists: Comic[][]) {
  return [...new Map(lists.flat().map((c) => [c.uuid, c])).values()];
}

export default async function Home({ searchParams }: PageProps<"/">) {
  // Design options under review (?hero=…&trending=…), see src/lib/designOptions.ts.
  const design = resolveDesign(await searchParams);

  const [rawFeed, rawCarousel, shorts, genres] = await Promise.all([
    getHomeFeed(),
    getTopCarousel(),
    getShorts(),
    getGenres(),
  ]);

  const [trending, popularByToonCentral, indieComics, feedCarousel, recentUploads, carousel] = shareEpisodeCounts([
    rawFeed.trending,
    rawFeed.popularByToonCentral,
    rawFeed.indieComics,
    rawFeed.carousel,
    rawFeed.recentUploads,
    rawCarousel,
  ]);
  const feed = { trending, popularByToonCentral, indieComics, carousel: feedCarousel, recentUploads };

  const heroSlides = carousel.length ? carousel : feed.carousel;
  const allComics = uniqueComics([feed.trending, feed.popularByToonCentral, feed.indieComics, feed.carousel, carousel]);

  // Shorts that belong to a series get a "Read the comic" link.
  const comicsById = new Map(allComics.map((c) => [c.id, c]));
  const linkedShorts = shorts.map((short) => {
    const comic = short.comicId != null ? comicsById.get(short.comicId) : undefined;
    return comic ? { ...short, linkedComic: { uuid: comic.uuid, title: comic.title } } : short;
  });

  // Originals: all 13 we know about (/home only sends 10), freshest first. Series the reader hasn't
  // just seen in the Top 10 go first, and the freshest of those takes the spotlight.
  const byLatest = (a: Comic, b: Comic) => (b.lastEpisodeAt ?? "").localeCompare(a.lastEpisodeAt ?? "");
  const inTopTen = new Set(feed.trending.slice(0, 10).map((c) => c.uuid));
  const originalsAll = allComics.filter((c) => c.isOriginal).sort(byLatest);
  const originals = [
    ...originalsAll.filter((c) => !inTopTen.has(c.uuid)),
    ...originalsAll.filter((c) => inTopTen.has(c.uuid)),
  ];
  const originalSpotlight = originals[0];

  // Genre sizes: real catalogue totals when the API is live, otherwise counted from the comics on this page.
  const catalogueCounts = await getGenreCounts(genres);
  const genreCounts =
    catalogueCounts ??
    new Map(genres.map((g) => [g.id, allComics.filter((c) => c.genres.includes(g.name)).length]));

  // recent_uploads is often empty; fall back to the most recently updated series.
  const latest = feed.recentUploads.length
    ? feed.recentUploads
    : [...allComics]
        .filter((c) => c.lastEpisodeAt)
        .sort((a, b) => b.lastEpisodeAt!.localeCompare(a.lastEpisodeAt!))
        .slice(0, 6);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-[1100px]" />
      <main className="relative pb-24 lg:pb-0">
        <Navigation />

        {/* Clears the fixed header */}
        <div className="h-[66px]" />

        {design.hero === "bleed" && <HeroCarousel variant="bleed" slides={heroSlides} />}

        <div className="mx-auto px-6 md:px-8 lg:px-10">
          {design.hero === "panel" && (
            <div className="pt-3.5">
              <HeroCarousel variant="panel" slides={heroSlides} />
            </div>
          )}
          <TrendingSection comics={feed.trending} variant={design.trending} />
          <ShortsSection shorts={linkedShorts} variant={design.shorts} />
          <OriginalsSection comics={originals} spotlight={originalSpotlight} variant={design.originals} />
          <IndiesSection comics={feed.indieComics} topTenIds={inTopTen} variant={design.indies} />
          <NewChaptersSection comics={latest} log={buildReleaseLog(allComics, linkedShorts)} variant={design.latest} />
          <GenresSection
            genres={genres}
            comics={allComics}
            counts={genreCounts}
            countSource={catalogueCounts ? "catalogue" : "page"}
            variant={design.genres}
          />
          <PremiumCTA variant={design.subscribe} />
        </div>
        <Footer
          stats={{
            originals: originals.length,
            creators: new Set(feed.indieComics.map((c) => c.creator.username)).size,
            shorts: shorts.filter((s) => !s.isSponsored).length,
            genres: genres.length,
          }}
        />
      </main>

      <DesignOptions selection={design} />
    </div>
  );
}
