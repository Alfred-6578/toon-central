"use client";

import { useCallback, useState } from "react";
import { MdPlayArrow } from "react-icons/md";
import { IoBookOutline } from "react-icons/io5";
import { useHoverPreview } from "@/components/home/shorts/HoverPreview";
import { ShortsFeed } from "@/components/home/shorts/ShortsFeed";
import type { Short } from "@/lib/api/types";
import { cloudinary } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";

// A short as a movie poster with a tear-off ticket stub.
function Poster({ short, onWatch }: { short: Short; onWatch: () => void }) {
  const preview = useHoverPreview(short.video);

  return (
    <button type="button" onClick={onWatch} {...preview.handlers} aria-label={`Watch ${short.title}`} className="group block w-[58vw] max-w-[230px] shrink-0 text-left sm:w-56">
      <div className="relative aspect-[2/3] overflow-hidden border-2 border-black bg-panel shadow-[5px_5px_0_rgba(242,187,48,0.35)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1 group-hover:shadow-[7px_9px_0_rgba(242,187,48,0.5)]">
        <img src={cloudinary(short.coverImage, 460)} alt="" loading="lazy" className="h-full w-full object-cover" />
        {preview.video}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {short.linkedComic && (
          <span className="tag absolute left-2 top-2 gap-1 bg-paper"><IoBookOutline /> Has a comic</span>
        )}
      </div>

      {/* Ticket stub, perforated from the poster */}
      <div className="relative border-2 border-t-0 border-black bg-paper px-3 pb-3 pt-3 text-ink">
        <span aria-hidden="true" className="absolute -top-px left-2 right-2 border-t-2 border-dashed border-ink/40" />
        <span aria-hidden="true" className="absolute -left-[9px] -top-[9px] h-4 w-4 rounded-full bg-black" />
        <span aria-hidden="true" className="absolute -right-[9px] -top-[9px] h-4 w-4 rounded-full bg-black" />
        <p className="line-clamp-1 text-sm font-bold">{short.title}</p>
        <p className="mt-0.5 truncate text-xs text-ink/60">{short.creator.username}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 gap-1 overflow-hidden">
            {short.genres.slice(0, 1).map((genre) => (
              <span key={genre} className={`tag border border-ink ${genreTag(genre)}`}>{genre}</span>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-0.5 font-display text-sm uppercase leading-none group-hover:underline">
            <MdPlayArrow className="text-lg" /> Watch
          </span>
        </div>
      </div>
    </button>
  );
}

export function NowShowing({ shorts }: { shorts: Short[] }) {
  const [playing, setPlaying] = useState<number | null>(null);
  const close = useCallback(() => setPlaying(null), []);

  return (
    <section aria-labelledby="now-showing" className="marquee -mx-6 mt-16 px-6 py-14 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
      <div className="mb-8 text-center">
        <h2 id="now-showing" className="marquee-title font-display text-5xl uppercase leading-none sm:text-6xl">Now Showing</h2>
        <p className="mt-3 text-sm text-slate-300">Animated stories, no reading required.</p>
      </div>

      <div className="hide-scrollbar -mx-6 overflow-x-auto px-6 pb-4 pt-1 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
        <div className="mx-auto flex w-max gap-6">
          {shorts.map((short, i) => (
            <Poster key={short.uuid} short={short} onWatch={() => setPlaying(i)} />
          ))}
        </div>
      </div>

      {playing !== null && <ShortsFeed shorts={shorts} startIndex={playing} onClose={close} />}
    </section>
  );
}
