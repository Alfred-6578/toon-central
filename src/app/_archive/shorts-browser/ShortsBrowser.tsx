"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import { FaRegEye } from "react-icons/fa6";
import { IoBookOutline, IoHeartOutline } from "react-icons/io5";
import { MdPlayArrow } from "react-icons/md";
import { PREVIEW_CLIP, PreviewVideo } from "@/components/home/shorts/HoverPreview";
import { ShortCard } from "@/components/home/shorts/ShortCard";
import { ShortsFeed } from "@/components/home/shorts/ShortsFeed";
import type { Short } from "@/lib/api/types";
import { cloudinary, cloudinaryVideo, comicHref, creatorHref, formatCount } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

type Playing = { list: Short[]; index: number; deepLinked: boolean } | null;

// The most-watched short, looping its 8-second preview like a trailer (a still poster for reduced motion).
function Featured({ short, onWatch }: { short: Short; onWatch: () => void }) {
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => true);

  return (
    <section className="grid gap-8 border-2 border-line bg-panel p-5 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-12">
      <button
        type="button"
        onClick={onWatch}
        aria-label={`Watch ${short.title}`}
        className="group relative mx-auto block w-[64vw] max-w-[300px] -rotate-1 border-[3px] border-black bg-ink shadow-[8px_8px_0_rgba(242,187,48,0.45)] transition-transform hover:rotate-0 lg:w-[300px]"
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          <img src={cloudinary(short.coverImage, 600)} alt="" className="h-full w-full object-cover" />
          {!reducedMotion && (
            <PreviewVideo src={cloudinaryVideo(short.video, 600, PREVIEW_CLIP)} className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
        <span className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center border-2 border-black bg-mint text-3xl text-ink">
          <MdPlayArrow />
        </span>
      </button>

      <div>
        <span className="tag -rotate-2 bg-sun text-sm">Most watched</span>
        <h2 className="mt-3 font-display text-5xl uppercase leading-[0.95] text-white sm:text-6xl">{short.title}</h2>
        <p className="mt-3 text-sm text-slate-300">
          by{" "}
          <Link href={creatorHref(short.creator.username)} className="font-semibold text-white hover:text-mint">
            {short.creator.username}
          </Link>
        </p>
        {short.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {short.genres.slice(0, 3).map((genre) => (
              <span key={genre} className={`tag ${genreTag(genre)}`}>{genre}</span>
            ))}
          </div>
        )}
        {short.description && <p className="mt-4 line-clamp-3 max-w-xl text-[15px] leading-7 text-slate-300">{short.description}</p>}
        <div className="mt-4 flex gap-4 text-sm text-slate-300">
          <span className="flex items-center gap-1.5"><FaRegEye /> {formatCount(short.views)} views</span>
          <span className="flex items-center gap-1.5"><IoHeartOutline /> {formatCount(short.likes)}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onWatch} className="btn btn-primary gap-1 px-6 py-3 text-base">
            <MdPlayArrow className="text-xl" /> Watch
          </button>
          {short.linkedComic && (
            <Link href={comicHref(short.linkedComic.uuid)} className="btn btn-ghost gap-2 px-5 py-3 text-base">
              <IoBookOutline /> Read the comic
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

type ShortsBrowserProps = {
  // This page of the grid.
  items: Short[];
  // Every short matching the current filters (shared links can point past this page).
  all: Short[];
  featured?: Short;
  // From a shared /shorts?short=… link.
  deepLink?: string;
  controls: ReactNode;
};

export function ShortsBrowser({ items, all, featured, deepLink, controls }: ShortsBrowserProps) {
  const [playing, setPlaying] = useState<Playing>(() => {
    const index = deepLink ? all.findIndex((s) => s.uuid === deepLink) : -1;
    return index >= 0 ? { list: all, index, deepLinked: true } : null;
  });
  const close = useCallback(() => setPlaying(null), []);
  const playFrom = (list: Short[], index: number) => setPlaying({ list, index, deepLinked: false });

  return (
    <>
      {featured && (
        <div className="mt-10">
          <Featured short={featured} onWatch={() => playFrom([featured, ...all.filter((s) => s.uuid !== featured.uuid)], 0)} />
        </div>
      )}

      <div className="mb-6 mt-12 flex flex-col gap-4 border-b-2 border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        {controls}
        {items.length > 0 && (
          <button type="button" onClick={() => playFrom(items, 0)} className="btn btn-primary shrink-0 gap-1 self-start px-5 py-2.5 lg:self-auto">
            <MdPlayArrow className="text-xl" /> Play all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((short, i) => (
          <ShortCard key={short.uuid} short={short} onOpen={() => playFrom(items, i)} className="w-full" />
        ))}
      </div>

      {playing && (
        <ShortsFeed shorts={playing.list} startIndex={playing.index} onClose={close} deepLinked={playing.deepLinked} />
      )}
    </>
  );
}
