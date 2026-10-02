"use client";

import type { Comic } from "@/lib/api/types";
import { cloudinary } from "@/lib/format";
import { CoverStrip } from "./CoverStrip";
import { SlideDetails } from "./SlideDetails";
import { useHeroCarousel } from "./useHeroCarousel";

// Option B: full-bleed. The banner art runs edge to edge; text sits on an ink gradient bottom-left.
// Phones and portrait tablets get the portrait cover instead, since landscape banners crop badly there.
export function BleedHero({ slides }: { slides: Comic[] }) {
  const hero = useHeroCarousel(slides.length);
  const { index, loaded, running, rootHandlers, swipeHandlers } = hero;
  const slide = slides[index];
  if (!slide) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured comics"
      {...rootHandlers}
      className="relative flex min-h-[min(82vh,720px)] flex-col overflow-hidden border-b-2 border-line bg-ink lg:min-h-[min(88vh,780px)]"
    >
      <div className="absolute inset-0" aria-hidden="true">
        {slides.map(
          (item, i) =>
            loaded.has(i) && (
              <picture key={item.uuid}>
                <source media="(min-width: 1024px)" srcSet={cloudinary(item.backgroundImage, 1920)} />
                <img
                  src={cloudinary(item.coverImage, 900)}
                  alt=""
                  fetchPriority={i === 0 ? "high" : "auto"}
                  className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 lg:object-center ${
                    i === index ? "opacity-100" : "opacity-0"
                  }`}
                />
              </picture>
            )
        )}
        <div className="halftone-overlay absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/0" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-ink/90 via-ink/35 to-transparent lg:block" />
      </div>

      <div
        {...swipeHandlers}
        className="relative flex flex-1 touch-pan-y items-end px-6 pb-8 pt-40 md:px-8 lg:px-10 lg:pb-12"
      >
        <div key={slide.uuid} className="max-w-2xl" aria-live={running ? "off" : "polite"}>
          <SlideDetails slide={slide} size="bleed" />
        </div>
      </div>

      <CoverStrip slides={slides} hero={hero} className="border-line/70 bg-ink/80 px-6 md:px-8 lg:px-10" />
    </section>
  );
}
