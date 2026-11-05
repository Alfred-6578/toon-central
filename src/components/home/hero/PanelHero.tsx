"use client";

import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref } from "@/lib/format";
import { HeroControls } from "./HeroControls";
import { SlideBody, SlideHead } from "./SlideDetails";
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
      aria-label="Featured Mafiki"
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
                onLoad={i === index ? hero.preloadNext : undefined}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  i === index ? "opacity-45" : "opacity-0"
                }`}
              />
            )
        )}
        <div className="halftone-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/30 lg:bg-gradient-to-r lg:from-ink lg:via-ink/75 lg:to-ink/10" />
      </div>

      {/* Phones: a small cover beside the label, title and genres, then the blurb and actions across the
          full width, so the slide stays about a screen tall. Desktop: text on the left, the big cover on
          the right. One set of elements, placed by grid areas. */}
      <div
        {...swipeHandlers}
        className="relative grid flex-1 touch-pan-y grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] content-center items-center gap-x-4 gap-y-5 p-4 pt-6 [grid-template-areas:'cover_head'_'body_body'] sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-x-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-12 lg:gap-y-6 lg:p-12 lg:[grid-template-areas:'head_cover'_'body_cover']"
      >
        <div key={`${slide.uuid}-head`} className="max-w-2xl self-center [grid-area:head] lg:self-end" aria-live={running ? "off" : "polite"}>
          <SlideHead slide={slide} />
        </div>
        <div key={`${slide.uuid}-body`} className="max-w-2xl self-start [grid-area:body]">
          <SlideBody slide={slide} />
        </div>

        <a
          href={comicHref(slide.uuid)}
          aria-label={`Read ${slide.title}`}
          className="relative block w-full -rotate-2 self-center border-[3px] border-black shadow-[5px_5px_0_var(--color-mint-deep)] transition-transform duration-300 [grid-area:cover] hover:rotate-0 sm:shadow-[8px_8px_0_var(--color-mint-deep)] lg:w-[280px] xl:w-[320px]"
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
                    onLoad={i === index ? hero.preloadNext : undefined}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                      i === index ? "opacity-100" : "opacity-0"
                    }`}
                  />
                )
            )}
          </div>
        </a>
      </div>

      <HeroControls slides={slides} hero={hero} className="bg-ink/85 px-4 sm:px-8 lg:px-12" />
    </section>
  );
}
