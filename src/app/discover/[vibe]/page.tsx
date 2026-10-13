import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { ComicGrid } from "@/components/ui/ComicGrid";
import { Pagination } from "@/components/ui/Pagination";
import { getSiteStats } from "@/lib/api/client";
import { getVibe, VIBES } from "@/lib/discover";
import { comicCount, genreHref } from "@/lib/format";
import { PAGE_SIZES, pageParam, paginate, withPage } from "@/lib/pagination";

type Params = PageProps<"/discover/[vibe]">;

const toneColor = { mint: "var(--color-mint)", sun: "var(--color-sun)", paper: "var(--color-paper)" };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { vibe: id } = await params;
  const vibe = VIBES.find((v) => v.id === id);
  return vibe ? { title: `${vibe.title} | Discover | Toon Central`, description: vibe.blurb } : { title: "Not found | Toon Central" };
}

export default async function VibePage({ params, searchParams }: Params) {
  const [{ vibe: id }, query] = await Promise.all([params, searchParams]);
  const [data, stats] = await Promise.all([getVibe(id), getSiteStats()]);
  if (!data) notFound();

  const { vibe, comics } = data;
  const baseHref = `/discover/${vibe.id}`;
  const result = paginate(comics, pageParam(query.page), PAGE_SIZES.comics);
  if (result.outOfRange) redirect(withPage(baseHref, result.totalPages));

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />

        <section style={{ "--dot-color": toneColor[vibe.tone] } as CSSProperties} className="relative overflow-hidden border-b-2 border-line">
          <div className="dot-field absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="relative px-6 pb-10 pt-6 md:px-8 lg:px-10 lg:pb-12">
            <nav aria-label="Breadcrumb" className="text-sm text-slate-400">
              <Link href="/discover" className="hover:text-mint">Discover</Link>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-slate-200">{vibe.title}</span>
            </nav>
            <h1 className="mt-8 font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl lg:text-8xl">{vibe.title}</h1>
            <p className="mt-4 max-w-xl text-slate-300">{vibe.blurb}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="mr-1">{comicCount(comics.length)} tagged</span>
              {vibe.genres.map((genre) => (
                <Link key={genre} href={genreHref(genre)} className="border-2 border-line px-2 py-1 font-semibold text-slate-300 hover:border-mint hover:text-white">
                  {genre}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto px-6 pb-16 pt-10 md:px-8 lg:px-10">
          {comics.length ? (
            <>
              <ComicGrid comics={result.items} limit={result.items.length} mobile="grid" />
              <Pagination result={result} baseHref={baseHref} noun="comics" />
            </>
          ) : (
            <div className="border-2 border-dashed border-line p-8 text-center">
              <p className="font-display text-4xl uppercase leading-none text-white">Nothing here yet</p>
              <p className="mt-3 text-sm text-slate-400">No comics in this preview carry these genres.</p>
              <Link href="/discover" className="btn btn-ghost mt-6 px-5 py-3">Back to Discover</Link>
            </div>
          )}
        </div>

        <Footer stats={stats} />
      </main>
    </div>
  );
}
