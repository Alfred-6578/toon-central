"use client";

import type { CSSProperties } from "react";
import { IoChevronBack, IoChevronForward, IoPause, IoPlay } from "react-icons/io5";
import type { Comic } from "@/lib/api/types";
import { SLIDE_MS, type HeroState } from "./useHeroCarousel";

const pad = (n: number) => String(n).padStart(2, "0");

const control =
  "flex h-9 w-9 shrink-0 items-center justify-center border-2 border-line bg-ink text-lg text-slate-200 transition-colors hover:border-mint hover:text-white sm:h-10 sm:w-10";

// A bar per slide (the current one fills up as the autoplay timer), then previous / count / next and
// pause. Bars rather than cover thumbnails: a row of covers under the slide read as a comic's episode list.
export function HeroControls({ slides, hero, className = "" }: { slides: Comic[]; hero: HeroState; className?: string }) {
  const { index, autoplay, running, userPaused, togglePaused, goTo } = hero;

  return (
    <div className={`relative flex items-center gap-3 border-t-2 border-line py-2.5 sm:gap-6 sm:py-3 ${className}`}>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {slides.map((item, i) => (
          <button
            key={item.uuid}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1} of ${slides.length}: ${item.title}`}
            aria-current={i === index ? "true" : undefined}
            className="group flex h-8 min-w-0 max-w-16 flex-1 items-center"
          >
            <span className={`relative block h-1 w-full overflow-hidden ${i < index ? "bg-slate-300" : "bg-white/20 group-hover:bg-white/40"}`}>
              {i === index &&
                (autoplay ? (
                  <span
                    key={index}
                    onAnimationEnd={() => goTo(index + 1)}
                    className="hero-progress absolute inset-0 bg-mint"
                    style={{ animationPlayState: running ? "running" : "paused", "--hero-duration": `${SLIDE_MS}ms` } as CSSProperties}
                  />
                ) : (
                  <span className="absolute inset-0 bg-mint" />
                ))}
            </span>
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous Mafiki" className={control}>
          <IoChevronBack />
        </button>
        <span className="hidden min-w-[4.5rem] text-center font-display text-lg leading-none text-slate-300 sm:block">
          {pad(index + 1)} <span className="text-slate-500">/ {pad(slides.length)}</span>
        </span>
        <button type="button" onClick={() => goTo(index + 1)} aria-label="Next Mafiki" className={control}>
          <IoChevronForward />
        </button>
      </div>

      {autoplay && (
        <button
          type="button"
          onClick={togglePaused}
          aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
          className={control}
        >
          {userPaused ? <IoPlay /> : <IoPause />}
        </button>
      )}
    </div>
  );
}
