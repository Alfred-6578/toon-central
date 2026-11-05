"use client";

import { FaRegEye } from "react-icons/fa6";
import { IoHeartOutline } from "react-icons/io5";
import type { Comic } from "@/lib/api/types";
import { cloudinaryAvatar, comicHref, formatCount, scheduleLabel } from "@/lib/format";
import { LibraryCTA } from "@/components/ui/LibraryCTA";
import { genreTag } from "@/lib/tagStyles";

function slideLabel(comic: Comic) {
  if (comic.hasNewEpisode) return "New episode";
  if (comic.isNew) return "New Mafiki";
  if (comic.isOriginal) return "Toon Central Original";
  return "Featured";
}

const titleSizes = {
  panel: "text-[2rem] sm:text-6xl xl:text-7xl",
  bleed: "text-5xl sm:text-7xl xl:text-8xl",
};

type Size = keyof typeof titleSizes;

// Label, title and genres. Key it by slide so the reveal replays.
export function SlideHead({ slide, size = "panel" }: { slide: Comic; size?: Size }) {
  return (
    <>
      <span className="hero-reveal tag -rotate-2 bg-sun text-xs sm:text-sm">{slideLabel(slide)}</span>

      <h1
        className={`hero-reveal mt-3 line-clamp-2 font-display uppercase leading-[0.95] text-white sm:mt-4 ${titleSizes[size]}`}
        style={{ animationDelay: "70ms" }}
      >
        {slide.title}
      </h1>

      <div className="hero-reveal mt-3 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2" style={{ animationDelay: "130ms" }}>
        {slide.genres.slice(0, 3).map((genre) => (
          <span key={genre} className={`tag ${genreTag(genre)}`}>{genre}</span>
        ))}
        {scheduleLabel(slide) && <span className="ml-1 text-sm font-semibold text-mint">{scheduleLabel(slide)}</span>}
      </div>
    </>
  );
}

// Blurb, actions and creator line. Tighter on phones, where the hero should stay about a screen tall.
export function SlideBody({ slide }: { slide: Comic }) {
  return (
    <>
      <p
        className="hero-reveal line-clamp-2 max-w-xl text-sm leading-6 text-slate-200 sm:line-clamp-3 sm:text-base sm:leading-7"
        style={{ animationDelay: "190ms" }}
      >
        {slide.description}
      </p>

      <div className="hero-reveal mt-4 flex items-center gap-3 sm:mt-6 sm:flex-wrap" style={{ animationDelay: "250ms" }}>
        <a href={comicHref(slide.uuid)} className="btn btn-primary flex-1 px-5 py-2.5 text-sm sm:flex-none sm:px-6 sm:py-3 sm:text-base">Read now</a>
        <LibraryCTA uuid={slide.uuid} className="flex-1 justify-center px-4 py-2.5 text-sm sm:flex-none sm:px-5 sm:py-3 sm:text-base" />
      </div>

      <div
        className="hero-reveal mt-4 flex items-center gap-x-4 gap-y-2 text-xs text-slate-300 sm:mt-6 sm:flex-wrap sm:gap-x-5 sm:text-sm"
        style={{ animationDelay: "310ms" }}
      >
        <span className="flex min-w-0 items-center gap-2">
          {slide.creator.photo && (
            <img src={cloudinaryAvatar(slide.creator.photo, 64)} alt="" className="h-6 w-6 shrink-0 border-2 border-line object-cover sm:h-7 sm:w-7" />
          )}
          <span className="truncate">by <span className="font-semibold text-white">{slide.creator.username}</span></span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5"><FaRegEye /> {formatCount(slide.views)} views</span>
        <span className="flex shrink-0 items-center gap-1.5"><IoHeartOutline /> {formatCount(slide.likes)}</span>
      </div>
    </>
  );
}

// The whole slide in one column (the full-bleed hero).
export function SlideDetails({ slide, size = "panel" }: { slide: Comic; size?: Size }) {
  return (
    <>
      <SlideHead slide={slide} size={size} />
      <div className="mt-4">
        <SlideBody slide={slide} />
      </div>
    </>
  );
}
