import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReleaseLog } from "@/components/home/latest/ReleaseLog";
import { buildReleaseLog, filterLog, UPDATE_FILTERS, type UpdateFilter } from "@/components/home/latest/releaseLogData";
import { FilterGroup, NewAndPopularShell } from "@/components/new/NewAndPopularShell";
import { getCatalogue, getShorts, getSiteStats } from "@/lib/api/client";
import { pageParam, paginate, withPage } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";

export const metadata: Metadata = {
  title: "Latest updates · New & Popular | Toon Central",
  description: "New Mafiki episodes and animated shorts on Toon Central, newest first.",
};

const PER_PAGE = 30;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const hrefFor = (filter: UpdateFilter) => (filter === "all" ? "/new/latest" : `/new/latest?show=${filter}`);

// New & Popular → Latest: everything new, newest first. The full version of the homepage's Latest Updates.
export default async function LatestPage({ searchParams }: PageProps<"/new/latest">) {
  const query = await searchParams;
  const filter = UPDATE_FILTERS.find((f) => f.value === one(query.show))?.value ?? "all";
  const [comics, shorts, stats] = await Promise.all([getCatalogue(), getShorts(), getSiteStats()]);

  const log = buildReleaseLog(comics, shorts, Infinity);
  const counts = Object.fromEntries(UPDATE_FILTERS.map((f) => [f.value, filterLog(log, f.value).length])) as Record<UpdateFilter, number>;
  const result = paginate(filterLog(log, filter), pageParam(query.page), PER_PAGE);
  if (result.outOfRange) redirect(withPage(hrefFor(filter), result.totalPages));

  return (
    <NewAndPopularShell
      tab="latest"
      lede="New episodes and animated shorts, newest first."
      controls={<FilterGroup options={UPDATE_FILTERS} current={filter} hrefFor={hrefFor} counts={counts} />}
      stats={stats}
    >
      {result.items.length ? (
        <ReleaseLog entries={result.items} />
      ) : (
        <p className="border-2 border-dashed border-line px-6 py-10 text-center text-sm text-slate-400">Nothing here yet.</p>
      )}
      <Pagination result={result} baseHref={hrefFor(filter)} noun="updates" />
      <p className="mt-8 text-xs text-slate-500">
        Each comic shows once, at its newest episode. Episode-by-episode history arrives with the live API.
      </p>
    </NewAndPopularShell>
  );
}
