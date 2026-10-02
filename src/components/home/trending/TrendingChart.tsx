import type { CSSProperties } from "react";
import { FaRegEye } from "react-icons/fa6";
import { IoHeartOutline } from "react-icons/io5";
import { VscNotebook } from "react-icons/vsc";
import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref, formatCount, scheduleLabel } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";

// "Completed", "Ongoing · Updates Fridays" while it keeps its schedule, otherwise just "Ongoing".
function statusLabel(comic: Comic) {
  if (comic.status === "COMPLETED") return "Completed";
  return ["Ongoing", scheduleLabel(comic)].filter(Boolean).join(" · ");
}

function Stats({ comic, className = "" }: { comic: Comic; className?: string }) {
  return (
    <span className={`flex items-center gap-3 text-xs text-slate-300 ${className}`}>
      {comic.episodes != null && (
        <span className="flex items-center gap-1"><VscNotebook /> {comic.episodes} ch</span>
      )}
      <span className="flex items-center gap-1"><FaRegEye /> {formatCount(comic.views)}</span>
      <span className="flex items-center gap-1"><IoHeartOutline /> {formatCount(comic.likes)}</span>
    </span>
  );
}

// #1 gets the feature slot: big cover, solid rank numeral, blurb and call to action.
function NumberOne({ comic }: { comic: Comic }) {
  return (
    <a
      href={comicHref(comic.uuid)}
      className="group relative flex h-full flex-col gap-6 overflow-hidden border-2 border-line bg-panel p-6 hover:border-mint sm:flex-row xl:p-8"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <img src={cloudinary(comic.backgroundImage, 1000)} alt="" loading="lazy" className="h-full w-full object-cover opacity-30" />
        <div className="halftone-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/40 via-ink/80 to-ink" />
      </div>

      <div className="relative shrink-0 self-center sm:w-[45%]">
        <span aria-hidden="true" className="rank-solid pointer-events-none absolute -bottom-6 -left-3 z-10 font-display text-[9rem] leading-none">
          1
        </span>
        <div className="aspect-[3/4] -rotate-1 overflow-hidden border-[3px] border-black shadow-[8px_8px_0_var(--color-sun)] transition-transform duration-300 group-hover:rotate-0">
          <img src={cloudinary(comic.coverImage, 600)} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      </div>

      <div className="relative flex min-w-0 flex-col justify-center">
        <span className="tag w-fit bg-sun">#1 most read</span>
        <h3 className="mt-3 font-display text-4xl uppercase leading-[0.95] text-white xl:text-5xl">{comic.title}</h3>
        <p className="mt-2 text-sm text-slate-300">
          by <span className="font-semibold text-white">{comic.creator.username}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {comic.genres.slice(0, 3).map((genre) => (
            <span key={genre} className={`tag ${genreTag(genre)}`}>{genre}</span>
          ))}
        </div>
        {comic.description && (
          <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-300">{comic.description}</p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Stats comic={comic} className="text-sm" />
          {statusLabel(comic) && <span className="text-xs font-semibold text-mint">{statusLabel(comic)}</span>}
        </div>
        <span className="btn btn-primary mt-6 w-fit px-6 py-3 text-base">Read now</span>
      </div>
    </a>
  );
}

function ChartRow({ comic, rank }: { comic: Comic; rank: number }) {
  return (
    <li>
      <a href={comicHref(comic.uuid)} className="group flex items-center gap-4 px-2 py-2.5 hover:bg-panel">
        <span
          aria-label={`Rank ${rank}`}
          className={`rank-outline w-12 shrink-0 text-center font-display text-5xl leading-none ${rank <= 3 ? "rank-top" : ""}`}
        >
          {rank}
        </span>
        <img
          src={cloudinary(comic.coverImage, 120)}
          alt=""
          loading="lazy"
          className="h-16 w-12 shrink-0 border-2 border-line object-cover group-hover:border-mint"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white group-hover:text-mint">{comic.title}</p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {comic.creator.username}
            {comic.genres[0] && ` · ${comic.genres[0]}`}
          </p>
        </div>
        <Stats comic={comic} className="max-sm:hidden" />
      </a>
    </li>
  );
}

// Mobile/tablet: swipeable rail with big outlined numerals overlapping each cover.
function ChartRail({ comics }: { comics: Comic[] }) {
  return (
    <div className="hide-scrollbar -mx-6 overflow-x-auto px-6 pb-2 lg:hidden">
      <ol className="flex w-max gap-3">
        {comics.map((comic, i) => (
          <li key={comic.uuid}>
            <a href={comicHref(comic.uuid)} className="group relative block w-[46vw] max-w-[220px] pl-9">
              <span
                aria-hidden="true"
                className={`absolute bottom-14 left-0 z-10 font-display text-[6.5rem] leading-none ${
                  i === 0 ? "rank-solid" : `rank-outline ${i < 3 ? "rank-top" : ""}`
                }`}
                style={i === 0 ? undefined : ({ "--rank-width": "3px" } as CSSProperties)}
              >
                {i + 1}
              </span>
              <div className="aspect-[3/4] overflow-hidden border-2 border-line group-hover:border-mint">
                <img src={cloudinary(comic.coverImage, 400)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-white">{comic.title}</p>
              <Stats comic={comic} className="mt-1" />
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TrendingChart({ comics }: { comics: Comic[] }) {
  const top = comics.slice(0, 10);
  const [first, ...rest] = top;
  if (!first) return null;

  return (
    <>
      <ChartRail comics={top} />

      <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <NumberOne comic={first} />
        <ol start={2} className="divide-y-2 divide-line border-2 border-line">
          {rest.map((comic, i) => (
            <ChartRow key={comic.uuid} comic={comic} rank={i + 2} />
          ))}
        </ol>
      </div>
    </>
  );
}
