import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MostReadChart } from "@/components/new/MostReadChart";
import { FilterGroup, NewAndPopularShell } from "@/components/new/NewAndPopularShell";
import { Pagination } from "@/components/ui/Pagination";
import { getCatalogue, getSiteStats } from "@/lib/api/client";
import type { Comic } from "@/lib/api/types";
import { pageParam, paginate, withPage } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Most read · New & Popular | Toon Central",
  description: "Every Mafiki on Toon Central, ranked by total reads.",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "originals", label: "Originals" },
  { value: "indies", label: "Indies" },
] as const;
type ChartFilter = (typeof FILTERS)[number]["value"];

const PER_PAGE = 30;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const hrefFor = (filter: ChartFilter) => (filter === "all" ? "/new" : `/new?show=${filter}`);
const matches = (filter: ChartFilter) => (c: Comic) => filter === "all" || (filter === "originals" ? c.isOriginal : !c.isOriginal);

// New & Popular → Most read (the default tab): every comic ranked by total reads. The full version of the homepage's Top 10.
export default async function MostReadPage({ searchParams }: PageProps<"/new">) {
  const query = await searchParams;
  const filter = FILTERS.find((f) => f.value === one(query.show))?.value ?? "all";
  const [catalogue, stats] = await Promise.all([getCatalogue(), getSiteStats()]);

  const ranked = [...catalogue].sort((a, b) => b.views - a.views);
  const counts = Object.fromEntries(FILTERS.map((f) => [f.value, ranked.filter(matches(f.value)).length])) as Record<ChartFilter, number>;
  const result = paginate(ranked.filter(matches(filter)), pageParam(query.page), PER_PAGE);
  if (result.outOfRange) redirect(withPage(hrefFor(filter), result.totalPages));

  return (
    <NewAndPopularShell
      tab="top"
      lede="Every Mafiki, ranked by total reads."
      controls={<FilterGroup options={FILTERS} current={filter} hrefFor={hrefFor} counts={counts} />}
      stats={stats}
    >
      <MostReadChart comics={result.items} startRank={result.from} />
      <Pagination result={result} baseHref={hrefFor(filter)} noun="Mafiki" />
      <p className="mt-8 text-xs text-slate-500">All-time reads. Weekly charts need read counts over time from the live API.</p>
    </NewAndPopularShell>
  );
}
