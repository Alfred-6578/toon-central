"use client";

import type { CSSProperties } from "react";
import { IoPause, IoPlay } from "react-icons/io5";
import type { Comic } from "@/lib/api/types";
import { cloudinary } from "@/lib/format";
import { SLIDE_MS, type HeroState } from "./useHeroCarousel";

const pad = (n: number) => String(n).padStart(2, "0");

// Cover thumbnails that double as slide picker and autoplay timer.
export function CoverStrip({ slides, hero, className = "" }: { slides: Comic[]; hero: HeroState; className?: string }) {
  const { index, autoplay, running, userPaused, togglePaused, goTo } = hero;

  return (
    <div className={`relative flex items-center gap-3 border-t-2 border-line py-3 ${className}`}>
      <div className="hide-scrollbar flex flex-1 gap-2 overflow-x-auto py-1">
        {slides.map((item, i) => (
          <button
            key={item.uuid}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show ${item.title}`}
            aria-current={i === index ? "true" : undefined}
            className={`relative h-16 w-12 shrink-0 overflow-hidden border-2 transition-opacity ${
              i === index ? "border-mint" : "border-line opacity-50 hover:opacity-100"
            }`}
          >
            <img src={cloudinary(item.coverImage, 120)} alt="" loading="lazy" className="h-full w-full object-cover" />
            {i === index && autoplay && (
              <span
                key={index}
                onAnimationEnd={() => goTo(index + 1)}
                className="hero-progress absolute inset-x-0 bottom-0 h-1 bg-mint"
                style={{ animationPlayState: running ? "running" : "paused", "--hero-duration": `${SLIDE_MS}ms` } as CSSProperties}
              />
            )}
          </button>
        ))}
      </div>

      <span className="hidden shrink-0 font-display text-lg leading-none text-slate-300 sm:block">
        {pad(index + 1)} <span className="text-slate-500">/ {pad(slides.length)}</span>
      </span>

      {autoplay && (
        <button
          type="button"
          onClick={togglePaused}
          aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
          className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-line bg-ink text-lg text-slate-200 hover:border-mint hover:text-white"
        >
          {userPaused ? <IoPlay /> : <IoPause />}
        </button>
      )}
    </div>
  );
}
