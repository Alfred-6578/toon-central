"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { IoChevronBack, IoChevronForward, IoFilm, IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref, formatCount } from "@/lib/format";
import { useImageUrl } from "@/lib/imageStore";
import { useLocalValue } from "@/lib/localValue";

const AUTO_MS = 5000;
// A card playing its trailer moves on when the trailer ends, or after this at most.
const TRAILER_MAX_MS = 60_000;

const reducedMotion = {
  subscribe: (onChange: () => void) => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  },
  read: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

// Trailers creators uploaded in Creator Studio (this browser), by comic id. In the "established" demo
// a creator's comics are the live ones, so their trailers land on the real cards here.
function useStudioTrailers() {
  const [established] = useLocalValue("tc-studio-comics-established", "{}");
  const [fresh] = useLocalValue("tc-studio-comics-new", "{}");
  const trailers: Record<string, string> = {};
  for (const raw of [fresh, established]) {
    try {
      for (const [id, item] of Object.entries(JSON.parse(raw) as Record<string, { trailer?: string | null }>)) {
        if (item?.trailer) trailers[id] = item.trailer;
      }
    } catch {
      // A damaged save just means no trailers from it.
    }
  }
  return trailers;
}

// The live site's main-menu strip, as the client's mock draws it: tall cover cards, the one in front
// centred on phones with its neighbours peeking. Swipe or scroll on phones, arrows on desktop; it moves
// on by itself until touched (a card with a trailer moves on when the trailer ends).
type Props = {
  comics: Comic[];
  // Comic uuid → trailer video (the comic's linked animated short).
  trailers?: Record<string, string>;
  // Comics a Studio upload can give a trailer to; one that has one joins the front of the strip.
  studioComics?: Comic[];
};

export function DiscoverCarousel({ comics: strip, trailers: linked = {}, studioComics = [] }: Props) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);
  const reduced = useSyncExternalStore(reducedMotion.subscribe, reducedMotion.read, () => true);
  const trailers = { ...linked, ...useStudioTrailers() };
  const promoted = studioComics.filter((c) => trailers[c.uuid] && !strip.some((s) => s.uuid === c.uuid));
  const comics = promoted.length ? [...promoted, ...strip] : strip;

  const cards = () => [...(track.current?.children ?? [])] as HTMLElement[];

  // Where the strip must scroll to for a card to be "in front": centred on phones (the mock), lined up
  // on the left from desktop (centring can't reach the first cards on wide screens).
  const restingLeft = (list: HTMLElement, card: HTMLElement) =>
    getComputedStyle(card).scrollSnapAlign.includes("center")
      ? card.offsetLeft - list.offsetLeft - (list.clientWidth - card.offsetWidth) / 2
      : card.offsetLeft - list.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft);

  const goTo = useCallback((index: number) => {
    const list = track.current;
    const card = list?.children[index] as HTMLElement | undefined;
    if (!list || !card) return;
    list.scrollTo({ left: restingLeft(list, card), behavior: "smooth" });
  }, []);

  // Which card is in front, as the reader scrolls.
  useEffect(() => {
    const list = track.current;
    if (!list) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4;
        const distances = cards().map((c) => Math.abs(restingLeft(list, c) - list.scrollLeft));
        // Scrolled to the end on desktop: the last cards can't reach the left edge, so the last one counts.
        const nearest = distances.indexOf(Math.min(...distances));
        setActive(atEnd && distances[nearest] > 4 ? cards().length - 1 : nearest);
      });
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener("scroll", onScroll);
    };
  }, []);

  const activeTrailer = !reduced && !!trailers[comics[active]?.uuid];
  const next = useCallback(() => goTo((active + 1) % comics.length), [active, comics.length, goTo]);

  useEffect(() => {
    if (paused || comics.length < 2 || reduced) return;
    const timer = setTimeout(next, activeTrailer ? TRAILER_MAX_MS : AUTO_MS);
    return () => clearTimeout(timer);
  }, [active, paused, comics.length, reduced, activeTrailer, next]);

  if (!comics.length) return null;

  return (
    <section
      aria-label="Featured Mafiki"
      aria-roledescription="carousel"
      className="relative overflow-hidden border-b-2 border-line"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocus={() => setPaused(true)}
    >
      {/* Tall cover cards: the one in front at full strength, its neighbours peeking either side. */}
      <ul
        ref={track}
        className="hide-scrollbar relative flex snap-x snap-mandatory gap-3 overflow-x-auto px-[11%] py-6 sm:gap-4 lg:scroll-px-10 lg:px-10 lg:py-8"
      >
        {comics.map((comic, i) => {
          const front = i === active;
          const trailer = trailers[comic.uuid];
          return (
            <li key={comic.uuid} className="relative w-[78%] shrink-0 snap-center sm:w-[42%] lg:w-[23%] lg:snap-start xl:w-[19%]">
              <Link
                href={comicHref(comic.uuid)}
                aria-current={front ? "true" : undefined}
                aria-label={`${comic.title}: ${formatCount(comic.views)} reads`}
                className={`group relative block aspect-[3/4] overflow-hidden border-2 bg-panel transition-[opacity,transform,box-shadow] duration-300 ${
                  front ? "border-black shadow-[6px_6px_0_#000]" : "scale-[0.96] border-black/60 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={cloudinary(comic.coverImage, 700)}
                  alt=""
                  loading={i < 4 ? "eager" : "lazy"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* The trailer plays on the card in front; the others show their cover. */}
                {trailer && front && !reduced && <TrailerVideo src={trailer} muted={!sound} onEnded={paused ? undefined : next} />}
                {trailer && (
                  <span className="tag absolute left-3 top-3 gap-1 bg-sun">
                    <IoFilm /> Trailer
                  </span>
                )}
              </Link>
              {trailer && front && !reduced && (
                <button
                  type="button"
                  onClick={() => setSound((on) => !on)}
                  aria-label={sound ? "Mute trailer" : "Play trailer sound"}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center border-2 border-black bg-ink/85 text-lg text-white hover:bg-mint hover:text-ink"
                >
                  {sound ? <IoVolumeHigh /> : <IoVolumeMute />}
                </button>
              )}
            </li>
          );
        })}
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
        onClick={next}
        aria-label="Next"
        className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border-2 border-black bg-mint text-xl text-ink shadow-[3px_3px_0_#000] lg:flex"
      >
        <IoChevronForward />
      </button>

      <div className="relative flex justify-center gap-1.5 pb-5" aria-hidden="true">
        {comics.map((c, i) => (
          <span key={c.uuid} className={`h-1.5 transition-all ${i === active ? "w-6 bg-mint" : "w-1.5 bg-white/30"}`} />
        ))}
      </div>
    </section>
  );
}

// A trailer playing over its card: muted by default (browsers only autoplay muted), filling the card.
function TrailerVideo({ src, muted, onEnded }: { src: string; muted: boolean; onEnded?: () => void }) {
  const url = useImageUrl(src);
  if (!url) return null;
  return (
    <video
      src={url}
      autoPlay
      muted={muted}
      playsInline
      onEnded={onEnded}
      loop={!onEnded}
      className="absolute inset-0 h-full w-full bg-black object-cover"
      aria-hidden="true"
    />
  );
}
