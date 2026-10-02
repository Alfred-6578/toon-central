"use client";

import { FaRegEye } from "react-icons/fa6";
import { IoAdd, IoCheckmark, IoHeartOutline } from "react-icons/io5";
import type { Comic } from "@/lib/api/types";
import { comicHref, formatCount, scheduleLabel } from "@/lib/format";
import { useMockLibrary, useMockSession } from "@/lib/mockSession";
import { genreTag } from "@/lib/tagStyles";

function slideLabel(comic: Comic) {
  if (comic.hasNewEpisode) return "New episode";
  if (comic.isNew) return "New series";
  if (comic.isOriginal) return "Toon Central Original";
  return "Featured";
}

const titleSizes = {
  panel: "text-5xl sm:text-6xl xl:text-7xl",
  bleed: "text-5xl sm:text-7xl xl:text-8xl",
};

// Label, title, genres, blurb, actions and creator line for one slide. Key it by slide so the reveal replays.
export function SlideDetails({ slide, size = "panel" }: { slide: Comic; size?: keyof typeof titleSizes }) {
  const { user, signIn } = useMockSession();
  const library = useMockLibrary();
  const saved = library.has(slide.uuid);

  const toggleLibrary = () => {
    if (!user) signIn();
    library.toggle(slide.uuid);
  };

  return (
    <>
      <span className="hero-reveal tag -rotate-2 bg-sun text-sm">{slideLabel(slide)}</span>

      <h1
        className={`hero-reveal mt-4 line-clamp-2 font-display uppercase leading-[0.95] text-white ${titleSizes[size]}`}
        style={{ animationDelay: "70ms" }}
      >
        {slide.title}
      </h1>

      <div className="hero-reveal mt-4 flex flex-wrap items-center gap-2" style={{ animationDelay: "130ms" }}>
        {slide.genres.slice(0, 3).map((genre) => (
          <span key={genre} className={`tag ${genreTag(genre)}`}>{genre}</span>
        ))}
        {scheduleLabel(slide) && <span className="ml-1 text-sm font-semibold text-mint">{scheduleLabel(slide)}</span>}
      </div>

      <p
        className="hero-reveal mt-4 line-clamp-2 max-w-xl text-base leading-7 text-slate-200 sm:line-clamp-3"
        style={{ animationDelay: "190ms" }}
      >
        {slide.description}
      </p>

      <div className="hero-reveal mt-6 flex flex-wrap items-center gap-3" style={{ animationDelay: "250ms" }}>
        <a href={comicHref(slide.uuid)} className="btn btn-primary px-6 py-3 text-base">Read now</a>
        <button
          type="button"
          onClick={toggleLibrary}
          aria-pressed={saved}
          title={user ? undefined : "Signs you in and saves this series"}
          className="btn btn-ghost px-5 py-3 text-base"
        >
          {saved ? <IoCheckmark className="text-lg" /> : <IoAdd className="text-lg" />}
          {saved ? "In library" : "Library"}
        </button>
      </div>

      <div
        className="hero-reveal mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300"
        style={{ animationDelay: "310ms" }}
      >
        <span className="flex items-center gap-2">
          {slide.creator.photo && (
            <img src={slide.creator.photo} alt="" className="h-7 w-7 border-2 border-line object-cover" />
          )}
          by <span className="font-semibold text-white">{slide.creator.username}</span>
        </span>
        <span className="flex items-center gap-1.5"><FaRegEye /> {formatCount(slide.views)} views</span>
        <span className="flex items-center gap-1.5"><IoHeartOutline /> {formatCount(slide.likes)}</span>
      </div>
    </>
  );
}
