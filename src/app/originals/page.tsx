import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OriginalSpotlight } from "@/components/home/originals/OriginalSpotlight";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { ComicGrid } from "@/components/ui/ComicGrid";
import { Pagination } from "@/components/ui/Pagination";
import { getOriginalsPageData, getSiteStats, OFFICIAL_ACCOUNT, type GenreSort } from "@/lib/api/client";
import { creatorHref, formatCount } from "@/lib/format";
import { PAGE_SIZES, pageParam, paginate, withPage } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Toon Central Originals | Toon Central",
  description: "Every Toon Central Original: Mafiki made with African creators.",
};

const sorts: { value: GenreSort; label: string }[] = [
  { value: "popular", label: "Most read" },
  { value: "updated", label: "Recently updated" },
  { value: "az", label: "A–Z" },
];

export default async function OriginalsPage({ searchParams }: PageProps<"/originals">) {
  const query = await searchParams;
  const sort = sorts.find((s) => s.value === query.sort)?.value ?? "popular";
  const [data, stats] = await Promise.all([getOriginalsPageData(sort), getSiteStats()]);

  const baseHref = sort === "popular" ? "/originals" : `/originals?sort=${sort}`;
  const result = paginate(data.comics, pageParam(query.page), PAGE_SIZES.comics);
  if (result.outOfRange) redirect(withPage(baseHref, result.totalPages));

  // Originals published under a collaborating creator's own account get credited by name.
  const collaborators = [...new Map(
    data.comics.filter((c) => c.creator.username !== OFFICIAL_ACCOUNT).map((c) => [c.creator.username, c.creator])
  ).values()];
  const firstPage = result.page === 1;

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />

        {/* The whole page is a cream magazine insert, like the homepage's Originals band */}
        <div className="paper-band relative px-6 pb-16 pt-10 md:px-8 lg:px-10">
          <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-80" />

          <div className="relative">
            <h1 className="font-display text-6xl uppercase leading-[0.9] text-ink sm:text-7xl lg:text-8xl">Toon Central Originals</h1>
            <p className="mt-4 text-sm text-ink/70">
              <span className="font-semibold text-ink">{data.comics.length} Mafiki</span> made with African creators ·{" "}
              {formatCount(data.reads)} reads
            </p>
            {collaborators.length > 0 && (
              <p className="mt-2 text-sm text-ink/70">
                In collaboration with{" "}
                {collaborators.map((creator, i) => (
                  <span key={creator.username}>
                    {i > 0 && (i === collaborators.length - 1 ? " and " : ", ")}
                    <Link href={creatorHref(creator.username)} className="font-semibold text-ink underline-offset-4 hover:underline">
                      {creator.username}
                    </Link>
                  </span>
                ))}
              </p>
            )}

            {firstPage && data.spotlight && (
              <div className="mt-10">
                <OriginalSpotlight comic={data.spotlight} />
              </div>
            )}

            <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-3">
              <h2 className="font-display text-3xl uppercase leading-none text-ink sm:text-4xl">All originals</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" role="group" aria-label="Sort by">
                <span className="text-ink/50">Sort:</span>
                {sorts.map(({ value, label }) => (
                  <Link
                    key={value}
                    href={value === "popular" ? "/originals" : `/originals?sort=${value}`}
                    scroll={false}
                    aria-current={sort === value ? "true" : undefined}
                    className={`border-b-2 pb-0.5 font-semibold ${sort === value ? "border-ink text-ink" : "border-transparent text-ink/60 hover:text-ink"}`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <ComicGrid comics={result.items} limit={result.items.length} tone="paper" showOriginalBadge={false} mobile="grid" />
            <Pagination result={result} baseHref={baseHref} noun="originals" tone="paper" />

            {data.source === "page" && (
              <p className="mt-8 text-xs text-ink/50">Showing the originals in this preview. The live API adds any that aren&apos;t here.</p>
            )}
          </div>
        </div>

        <Footer stats={stats} />
      </main>
    </div>
  );
}
