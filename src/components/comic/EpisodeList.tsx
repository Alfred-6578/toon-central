import Link from "next/link";
import type { ReactNode } from "react";
import { IoLockClosed } from "react-icons/io5";
import { dateParts } from "@/components/home/latest/releaseLogData";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Comic, ComicPageData } from "@/lib/api/types";
import { cloudinary, comicHref } from "@/lib/format";
import { PAGE_SIZES, paginate } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { readerHref } from "./ComicHeader";

const formatDate = (date: string) => {
  const { day, month, year } = dateParts(date);
  return `${day} ${month} ${year}`;
};

type EpisodeListProps = Pick<ComicPageData, "episodes" | "episodesSource"> & {
  comic: Comic;
  page: number;
  // Replaces the "Episodes" heading, e.g. with the Episodes | Shorts tabs.
  heading?: ReactNode;
};

export function EpisodeList({ comic, episodes, episodesSource, page, heading }: EpisodeListProps) {
  const result = paginate(episodes, page, PAGE_SIZES.episodes);
  const summary = episodes.length > 0 && (
    <span className="pb-0.5 text-sm text-slate-400">
      {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
    </span>
  );
  return (
    <>
      {heading ? (
        <>
          {heading}
          {summary && <p className="-mt-1 mb-5">{summary}</p>}
        </>
      ) : (
        <SectionHeader title="Episodes" action={null}>{summary}</SectionHeader>
      )}

      {episodesSource === "placeholder" && (
        <p className="mb-5 border-2 border-dashed border-line px-4 py-3 text-xs text-slate-400">
          Episode titles and dates are placeholders built from the chapter count. They&apos;ll be replaced with the real list once the
          live API is connected.
        </p>
      )}

      {episodesSource === "unknown" ? (
        <div className="flex flex-col items-start gap-4 border-2 border-line bg-panel p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-slate-300">
            The episode list for this Mafiki comes from the live API, which isn&apos;t connected in this preview. You can still start
            from the first episode.
          </p>
          <Link href={readerHref(comic.uuid)} className="btn btn-primary px-5 py-3">Read episode 1</Link>
        </div>
      ) : (
        <ol className="grid gap-3 md:grid-cols-2">
          {result.items.map((episode) => (
            <li key={episode.number}>
              <Link
                href={readerHref(comic.uuid, episode.number)}
                className="group flex items-center gap-4 border-2 border-line bg-panel p-3 transition-colors hover:border-mint"
              >
                <span className="w-10 shrink-0 text-center font-display text-3xl leading-none text-slate-300">{episode.number}</span>
                <img
                  src={cloudinary(comic.coverImage, 120)}
                  alt=""
                  loading="lazy"
                  className={`aspect-[3/4] w-11 shrink-0 border-2 border-line object-cover ${episode.locked ? "opacity-50 grayscale" : ""}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white group-hover:text-mint">{episode.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{episode.publishedAt ? formatDate(episode.publishedAt) : " "}</p>
                </div>
                {episode.locked ? (
                  <span className="tag shrink-0 gap-1 bg-sun"><IoLockClosed /> Premium</span>
                ) : (
                  <span className="tag shrink-0 bg-mint">Free</span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
      {episodesSource !== "unknown" && (
        <Pagination result={result} baseHref={comicHref(comic.uuid)} noun="episodes" hash="#episodes" />
      )}
    </>
  );
}
