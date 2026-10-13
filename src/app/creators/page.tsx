import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreatorCard, StudioCard } from "@/components/creator/CreatorCard";
import { PublishCard } from "@/components/home/indies/CreatorShelves";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { Pagination } from "@/components/ui/Pagination";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PAGE_SIZES, pageParam, paginate, withPage } from "@/lib/pagination";
import { getCreatorsDirectory, getSiteStats, type CreatorSort } from "@/lib/api/client";
import { comicCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Creators | Toon Central",
  description: "The African creators and animators behind the Mafiki and shorts on Toon Central.",
};

const sorts: { value: CreatorSort; label: string }[] = [
  { value: "popular", label: "Most read" },
  { value: "active", label: "Recently active" },
  { value: "az", label: "A–Z" },
];

export default async function CreatorsPage({ searchParams }: PageProps<"/creators">) {
  const query = await searchParams;
  const sort = sorts.find((s) => s.value === query.sort)?.value ?? "popular";
  const [creators, stats] = await Promise.all([getCreatorsDirectory(sort), getSiteStats()]);

  // The studio leads page 1; everyone else is paginated in sort order, grouped within each page.
  const studio = creators.find((c) => c.isOfficial);
  const baseHref = sort === "popular" ? "/creators" : `/creators?sort=${sort}`;
  const result = paginate(creators.filter((c) => !c.isOfficial), pageParam(query.page), PAGE_SIZES.creators);
  if (result.outOfRange) redirect(withPage(baseHref, result.totalPages));
  const indies = result.items.filter((c) => c.comics.length > 0);
  const animators = result.items.filter((c) => c.comics.length === 0);
  const indieTotal = creators.filter((c) => !c.isOfficial && c.comics.length > 0).length;
  const totalComics = creators.reduce((sum, c) => sum + c.stats.comics, 0);
  const totalShorts = creators.reduce((sum, c) => sum + c.shorts.length, 0);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-[700px]" />
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />

        <div className="mx-auto px-6 pb-16 md:px-8 lg:px-10">
          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl">Creators</h1>
              <p className="mt-3 text-sm text-slate-300">
                {creators.length} creators · {comicCount(totalComics)} · {totalShorts} shorts
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" role="group" aria-label="Sort by">
              <span className="text-slate-500">Sort:</span>
              {sorts.map(({ value, label }) => (
                <Link
                  key={value}
                  href={value === "popular" ? "/creators" : `/creators?sort=${value}`}
                  scroll={false}
                  aria-current={sort === value ? "true" : undefined}
                  className={`border-b-2 pb-0.5 font-semibold ${sort === value ? "border-mint text-white" : "border-transparent text-slate-400 hover:text-white"}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {studio && result.page === 1 && (
            <div className="mt-8">
              <StudioCard data={studio} />
            </div>
          )}

          {indies.length > 0 && (
            <section className="mt-14">
              <SectionHeader title="Independent creators" action={null}>
                <span className="pb-0.5 text-sm text-slate-400">{indieTotal} creators</span>
              </SectionHeader>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {indies.map((data) => (
                  <CreatorCard key={data.creator.username} data={data} />
                ))}
              </div>
            </section>
          )}

          {animators.length > 0 && (
            <section className="mt-14">
              <SectionHeader title="Animators" action={null}>
                <span className="pb-0.5 text-sm text-slate-400">Shorts-only creators</span>
              </SectionHeader>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {animators.map((data) => (
                  <CreatorCard key={data.creator.username} data={data} />
                ))}
              </div>
            </section>
          )}

          <Pagination result={result} baseHref={baseHref} noun="creators" />

          <div className="mt-14">
            <PublishCard className="" />
          </div>
        </div>

        <Footer stats={stats} />
      </main>
    </div>
  );
}
