"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaRegEye } from "react-icons/fa6";
import { IoChevronBack, IoChevronForward, IoHeartOutline } from "react-icons/io5";
import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref, formatCount } from "@/lib/format";

const AUTO_MS = 5000;

// The live site's main-menu strip: wide banner cards sliding sideways over a blurred copy of the
// current one. Swipe or scroll on phones, arrows on desktop; it moves on by itself until touched.
export function DiscoverCarousel({ comics }: { comics: Comic[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const cards = () => [...(track.current?.children ?? [])] as HTMLElement[];

  const goTo = useCallback((index: number) => {
    const list = track.current;
    const card = list?.children[index] as HTMLElement | undefined;
    if (!list || !card) return;
    // Left-aligned like the live site (centring can't reach the first cards on wide screens).
    list.scrollTo({ left: card.offsetLeft - list.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft), behavior: "smooth" });
  }, []);

  // Which card sits at the left edge, as the reader scrolls.
  useEffect(() => {
    const list = track.current;
    if (!list) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const start = list.scrollLeft + parseFloat(getComputedStyle(list).paddingLeft);
        const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4;
        const distances = cards().map((c) => Math.abs(c.offsetLeft - list.offsetLeft - start));
        // Scrolled to the end: the last cards can't reach the left edge, so count the last one as current.
        setActive(atEnd ? cards().length - 1 : distances.indexOf(Math.min(...distances)));
      });
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (paused || comics.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => goTo((active + 1) % comics.length), AUTO_MS);
    return () => clearTimeout(timer);
  }, [active, paused, comics.length, goTo]);

  if (!comics.length) return null;
  const current = comics[active] ?? comics[0];

  return (
    <section
      aria-label="Featured comics"
      aria-roledescription="carousel"
      className="relative overflow-hidden border-b-2 border-line"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocus={() => setPaused(true)}
    >
      {/* Blurred backdrop of the current card, like the live site. */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          key={current.uuid}
          src={cloudinary(current.backgroundImage || current.coverImage, 600)}
          alt=""
          className="h-full w-full scale-110 object-cover opacity-40 blur-2xl transition-opacity duration-700"
        />
        <div className="halftone-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/40 to-ink" />
      </div>

      <ul
        ref={track}
        className="hide-scrollbar relative flex snap-x snap-mandatory scroll-px-6 gap-5 overflow-x-auto px-6 py-8 md:scroll-px-8 md:px-8 lg:scroll-px-10 lg:px-10 lg:py-10"
      >
        {comics.map((comic, i) => (
          <li key={comic.uuid} className="w-[88%] shrink-0 snap-start sm:w-[58%] lg:w-[40%] xl:w-[32%]">
            <Link
              href={comicHref(comic.uuid)}
              aria-current={i === active ? "true" : undefined}
              className={`group relative block aspect-[16/10] overflow-hidden border-2 bg-panel transition-[transform,box-shadow,border-color] duration-300 ${
                i === active ? "border-black shadow-[6px_6px_0_#000]" : "border-black/60 opacity-80 hover:opacity-100"
              }`}
            >
              <img
                src={cloudinary(comic.backgroundImage || comic.coverImage, 720)}
                alt=""
                loading={i < 4 ? "eager" : "lazy"}
                className="h-full w-full object-cover object-[50%_25%] transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-16">
                <p className="truncate font-display text-3xl uppercase leading-none text-white sm:text-4xl">{comic.title}</p>
                <p className="mt-2 flex items-center gap-3 text-sm font-semibold text-slate-200">
                  <span className="flex items-center gap-1"><FaRegEye /> {formatCount(comic.views)}</span>
                  <span className="flex items-center gap-1"><IoHeartOutline /> {formatCount(comic.likes)}</span>
                  {comic.genres[0] && <span className="text-slate-400">{comic.genres[0]}</span>}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => goTo(Math.max(0, active - 1))}
        disabled={active === 0}
        aria-label="Previous"
        className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border-2 border-black bg-mint text-xl text-ink shadow-[3px_3px_0_#000] disabled:opacity-0 lg:flex"
      >
        <IoChevronBack />
      </button>
      <button
        type="button"
        onClick={() => goTo((active + 1) % comics.length)}
        aria-label="Next"
        className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border-2 border-black bg-mint text-xl text-ink shadow-[3px_3px_0_#000] lg:flex"
      >
        <IoChevronForward />
      </button>

      <div className="relative flex justify-center gap-1.5 pb-4" aria-hidden="true">
        {comics.map((c, i) => (
          <span key={c.uuid} className={`h-1.5 transition-all ${i === active ? "w-6 bg-mint" : "w-1.5 bg-white/30"}`} />
        ))}
      </div>
    </section>
  );
}
