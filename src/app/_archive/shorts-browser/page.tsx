// ARCHIVED: the original /shorts page (marquee header, featured short, filters, paginated grid).
// /shorts is now the full-screen feed (src/app/shorts/page.tsx). Folders starting with "_" aren't
// routed, so this file is kept and type-checked but not live. To restore it, move this folder's
// page.tsx back to src/app/shorts/ (and ShortsBrowser.tsx to src/components/shorts/).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { ShortsBrowser } from "./ShortsBrowser";
import { Pagination } from "@/components/ui/Pagination";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getCreatorsDirectory, getShortsPageData, getSiteStats, type ShortSort } from "@/lib/api/client";
import { formatCount, genreSlug } from "@/lib/format";
import { PAGE_SIZES, pageParam, paginate, withPage } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Shorts | Toon Central",
  description: "Animated shorts from African creators on Toon Central.",
};

const sorts: { value: ShortSort; label: string }[] = [
  { value: "popular", label: "Most watched" },
  { value: "newest", label: "Newest" },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function href(genre: string | null, sort: ShortSort) {
  const params = new URLSearchParams();
  if (genre) params.set("genre", genre);
  if (sort !== "popular") params.set("sort", sort);
  const query = params.toString();
  return `/shorts${query ? `?${query}` : ""}`;
}

export default async function ShortsPage({ searchParams }: PageProps<"/shorts">) {
  const query = await searchParams;
  const sort = sorts.find((s) => s.value === one(query.sort))?.value ?? "popular";
  const genre = one(query.genre) ?? null;
  const deepLink = one(query.short);

  const [data, creators, stats] = await Promise.all([
    getShortsPageData(genre, sort),
    getCreatorsDirectory("popular"),
    getSiteStats(),
  ]);
  // Unknown genre filter: drop it rather than show an empty page.
  if (genre && !data.genres.some((g) => genreSlug(g) === genre)) redirect(href(null, sort));

  // Unfiltered, the most-watched short gets the featured slot on page 1 and stays out of the grid,
  // so it never sits twice side by side.
  const featured = genre ? undefined : data.featured;
  const listed = featured ? data.shorts.filter((s) => s.uuid !== featured.uuid) : data.shorts;

  const baseHref = href(genre, sort);
  const result = paginate(listed, pageParam(query.page), PAGE_SIZES.shorts);
  if (result.outOfRange) redirect(withPage(baseHref, result.totalPages));

  const animators = creators.filter((c) => c.shorts.length > 0);

  const controls = (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="hide-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 md:mx-0 md:flex-wrap md:px-0">
        <Link
          href={href(null, sort)}
          aria-current={!genre ? "true" : undefined}
          className={`shrink-0 border-2 px-3 py-1.5 text-sm font-semibold ${!genre ? "border-black bg-mint text-ink" : "border-line text-slate-300 hover:border-mint hover:text-white"}`}
        >
          All
        </Link>
        {data.genres.map((g) => {
          const active = genreSlug(g) === genre;
          return (
            <Link
              key={g}
              href={href(genreSlug(g), sort)}
              aria-current={active ? "true" : undefined}
              className={`shrink-0 border-2 px-3 py-1.5 text-sm font-semibold ${active ? "border-black bg-mint text-ink" : "border-line text-slate-300 hover:border-mint hover:text-white"}`}
            >
              {g}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" role="group" aria-label="Sort by">
        <span className="text-slate-500">Sort:</span>
        {sorts.map(({ value, label }) => (
          <Link
            key={value}
            href={href(genre, value)}
            scroll={false}
            aria-current={sort === value ? "true" : undefined}
            className={`border-b-2 pb-0.5 font-semibold ${sort === value ? "border-mint text-white" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            {label}
          </Link>
        ))}
        <span className="text-slate-500">· {data.shorts.filter((s) => !s.isSponsored).length} shorts</span>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />

        {/* Marquee header, continuing Discover's "Now Showing" */}
        <header className="marquee px-6 py-16 text-center md:px-8 lg:px-10">
          <h1 className="marquee-title font-display text-7xl uppercase leading-none sm:text-8xl">Shorts</h1>
          <p className="mt-4 text-slate-300">Animated stories from African creators.</p>
          <p className="mt-2 text-sm text-slate-400">
            {data.totals.shorts} shorts · {formatCount(data.totals.views)} views · {data.totals.animators} animators
          </p>
        </header>

        <div className="mx-auto px-6 pb-16 md:px-8 lg:px-10">
          <ShortsBrowser
            items={result.items}
            all={data.shorts}
            featured={result.page === 1 ? featured : undefined}
            deepLink={deepLink}
            controls={controls}
          />
          <Pagination result={result} baseHref={baseHref} noun="shorts" />

          {data.source === "page" && (
            <p className="mt-8 text-xs text-slate-500">Showing the shorts in this preview. The full collection loads once the live API is connected.</p>
          )}

          {animators.length > 0 && (
            <section className="mt-16">
              <SectionHeader title="The animators" action="All creators" href="/creators" />
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {animators.map((creator) => (
                  <CreatorCard key={creator.creator.username} data={creator} />
                ))}
              </div>
            </section>
          )}
        </div>

        <Footer stats={stats} />
      </main>
    </div>
  );
}
