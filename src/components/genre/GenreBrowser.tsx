import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GenreHeader } from "@/components/genre/GenreHeader";
import { GenreWall } from "@/components/genre/GenreWall";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { ComicGrid } from "@/components/ui/ComicGrid";
import { getCatalogue, getGenreCounts, getGenrePageData, getSiteStats, type GenreKind, type GenreSort } from "@/lib/api/client";
import { genreHref } from "@/lib/format";
import { PAGE_SIZES, pageParam, paginate, withPage } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";

type Query = Record<string, string | string[] | undefined>;

const sorts: { value: GenreSort; label: string }[] = [
  { value: "popular", label: "Most read" },
  { value: "updated", label: "Recently updated" },
  { value: "az", label: "A–Z" },
];
const kinds: { value: GenreKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "originals", label: "Originals" },
  { value: "indies", label: "Indies" },
];

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

function href(slugName: string, sort: GenreSort, kind: GenreKind) {
  const params = new URLSearchParams();
  if (sort !== "popular") params.set("sort", sort);
  if (kind !== "all") params.set("kind", kind);
  const query = params.toString();
  return `${genreHref(slugName)}${query ? `?${query}` : ""}`;
}

// The genre browser, shared by /genres (default genre) and /genres/[slug].
export async function GenreBrowser({ slug, query }: { slug: string; query: Query }) {
  const sort = pick(query.sort, sorts.map((s) => s.value), "popular");
  const kind = pick(query.kind, kinds.map((k) => k.value), "all");

  const [data, stats, catalogue] = await Promise.all([getGenrePageData(slug, sort, kind), getSiteStats(), getCatalogue()]);
  if (!data) notFound();

  const { genre, genres, comics, totals, source } = data;
  // Genre sizes for the wall: real catalogue totals when the API is live, otherwise counted from what we have.
  const counts =
    (await getGenreCounts(genres)) ?? new Map(genres.map((g) => [g.id, catalogue.filter((c) => c.genres.includes(g.name)).length]));
  const baseHref = href(genre.name, sort, kind);
  const result = paginate(comics, pageParam(query.page), PAGE_SIZES.comics);
  if (result.outOfRange) redirect(withPage(baseHref, result.totalPages));
  // Empty genre: point at what's popular overall instead of a dead end.
  const fallback = totals.all === 0 ? [...catalogue].sort((a, b) => b.views - a.views).slice(0, 5) : [];

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />

        <GenreWall genres={genres} comics={catalogue} counts={counts} current={genre.id} />

        <GenreHeader genre={genre} total={totals.all} originals={totals.originals} indies={totals.indies} />

        <div className="mx-auto px-6 md:px-8 lg:px-10">
          {totals.all > 0 ? (
            <section className="mb-16 mt-6">
              <div className="mb-6 flex flex-col gap-4 border-b-2 border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex border-2 border-line" role="group" aria-label="Show">
                  {kinds.map(({ value, label }) => {
                    const count = totals[value];
                    const active = kind === value;
                    return count === 0 && value !== "all" ? (
                      <span key={value} className="px-3 py-1.5 text-xs font-semibold text-slate-600">{label} 0</span>
                    ) : (
                      <Link
                        key={value}
                        href={href(genre.name, sort, value)}
                        scroll={false}
                        aria-current={active ? "true" : undefined}
                        className={`px-3 py-1.5 text-xs font-semibold ${active ? "bg-mint text-ink" : "text-slate-300 hover:text-white"}`}
                      >
                        {label} {count}
                      </Link>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" role="group" aria-label="Sort by">
                  <span className="text-slate-500">Sort:</span>
                  {sorts.map(({ value, label }) => (
                    <Link
                      key={value}
                      href={href(genre.name, value, kind)}
                      scroll={false}
                      aria-current={sort === value ? "true" : undefined}
                      className={`border-b-2 pb-0.5 font-semibold ${sort === value ? "border-mint text-white" : "border-transparent text-slate-400 hover:text-white"}`}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              <ComicGrid comics={result.items} limit={result.items.length} mobile="grid" />
              <Pagination result={result} baseHref={baseHref} noun="Mafiki" />

              {source === "page" && (
                <p className="mt-8 text-xs text-slate-500">
                  Showing the Mafiki in this preview. The full {genre.name} catalogue loads once the live API is connected.
                </p>
              )}
            </section>
          ) : (
            <section className="mb-16 mt-10">
              <div className="border-2 border-dashed border-line p-8 text-center">
                <p className="font-display text-4xl uppercase leading-none text-white">No {genre.name} Mafiki yet</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                  {source === "page"
                    ? "None of the Mafiki in this preview are tagged with this genre. The full catalogue may have some once the live API is connected."
                    : "Be the first to publish one."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/genres" className="btn btn-ghost px-5 py-3">Most popular genre</Link>
                  <Link href="/creator101" className="btn btn-primary hidden px-5 py-3 lg:inline-flex">Publish a story</Link>
                </div>
              </div>

              <h2 className="mt-12 font-display text-3xl uppercase leading-none text-white">Popular right now</h2>
              <div className="mt-5">
                <ComicGrid comics={fallback} limit={5} mobile="grid" />
              </div>
            </section>
          )}
        </div>

        <Footer stats={stats} />
      </main>
    </div>
  );
}
