import Link from "next/link";
import { IoLockClosed } from "react-icons/io5";
import { dateParts } from "@/components/home/latest/releaseLogData";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FREE_EPISODES } from "@/lib/api/client";
import type { Comic, ComicPageData } from "@/lib/api/types";
import { cloudinary } from "@/lib/format";
import { readerHref } from "./ComicHeader";

const formatDate = (date: string) => {
  const { day, month, year } = dateParts(date);
  return `${day} ${month} ${year}`;
};

type EpisodeListProps = Pick<ComicPageData, "episodes" | "episodesSource"> & { comic: Comic };

export function EpisodeList({ comic, episodes, episodesSource }: EpisodeListProps) {
  return (
    <section id="episodes" className="mt-12">
      <SectionHeader title="Episodes" action={null}>
        {episodes.length > 0 && (
          <span className="pb-0.5 text-sm text-slate-400">
            {episodes.length} {episodes.length === 1 ? "episode" : "episodes"} · first {FREE_EPISODES} free
          </span>
        )}
      </SectionHeader>

      {episodesSource === "placeholder" && (
        <p className="mb-5 border-2 border-dashed border-line px-4 py-3 text-xs text-slate-400">
          Episode titles and dates are placeholders built from the chapter count. They&apos;ll be replaced with the real list once the
          live API is connected.
        </p>
      )}

      {episodesSource === "unknown" ? (
        <div className="flex flex-col items-start gap-4 border-2 border-line bg-panel p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-slate-300">
            The episode list for this series comes from the live API, which isn&apos;t connected in this preview. You can still start
            from the first episode.
          </p>
          <Link href={readerHref(comic.uuid)} className="btn btn-primary px-5 py-3">Read episode 1</Link>
        </div>
      ) : (
        <ol className="grid gap-3 md:grid-cols-2">
          {episodes.map((episode) => (
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
    </section>
  );
}
