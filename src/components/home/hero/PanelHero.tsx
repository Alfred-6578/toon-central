"use client";

import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref } from "@/lib/format";
import { CoverStrip } from "./CoverStrip";
import { SlideDetails } from "./SlideDetails";
import { useHeroCarousel } from "./useHeroCarousel";

// Option A: boxed hero. The cover is the hero image, framed as a tilted comic panel over a halftoned banner.
export function PanelHero({ slides }: { slides: Comic[] }) {
  const hero = useHeroCarousel(slides.length);
  const { index, loaded, running, rootHandlers, swipeHandlers } = hero;
  const slide = slides[index];
  if (!slide) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured comics"
      {...rootHandlers}
      className="relative flex flex-col overflow-hidden border-2 border-line bg-panel lg:min-h-[min(80vh,680px)]"
    >
      {/* Promo banner, pushed back: dimmed and screened with halftone so its baked-in text becomes texture */}
      <div className="absolute inset-0" aria-hidden="true">
        {slides.map(
          (item, i) =>
            loaded.has(i) && (
              <img
                key={item.uuid}
                src={cloudinary(item.backgroundImage, 1400)}
                alt=""
                fetchPriority={i === 0 ? "high" : "auto"}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  i === index ? "opacity-45" : "opacity-0"
                }`}
              />
            )
        )}
        <div className="halftone-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/30 lg:bg-gradient-to-r lg:from-ink lg:via-ink/75 lg:to-ink/10" />
      </div>

      <div
        {...swipeHandlers}
        className="relative grid flex-1 touch-pan-y items-center gap-7 p-5 pt-7 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12 lg:p-12"
      >
        <div key={slide.uuid} className="order-2 max-w-2xl lg:order-1" aria-live={running ? "off" : "polite"}>
          <SlideDetails slide={slide} />
        </div>

        <a
          href={comicHref(slide.uuid)}
          aria-label={`Read ${slide.title}`}
          className="relative order-1 block w-[44vw] max-w-[190px] -rotate-2 border-[3px] border-black shadow-[8px_8px_0_var(--color-mint-deep)] transition-transform duration-300 hover:rotate-0 sm:max-w-[230px] lg:order-2 lg:w-[280px] lg:max-w-none xl:w-[320px]"
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-ink">
            {slides.map(
              (item, i) =>
                loaded.has(i) && (
                  <img
                    key={item.uuid}
                    src={cloudinary(item.coverImage, 700)}
                    alt=""
                    fetchPriority={i === 0 ? "high" : "auto"}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                      i === index ? "opacity-100" : "opacity-0"
                    }`}
                  />
                )
            )}
          </div>
        </a>
      </div>

      <CoverStrip slides={slides} hero={hero} className="bg-ink/85 px-5 sm:px-8 lg:px-12" />
    </section>
  );
}
