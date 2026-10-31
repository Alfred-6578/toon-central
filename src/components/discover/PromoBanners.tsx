"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoArrowForward, IoCellular, IoCheckmark } from "react-icons/io5";
import { MtnPayFlow, openMtnPay } from "@/components/mtn/MtnPayFlow";
import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref } from "@/lib/format";
import { MTN_DAILY_PRICE } from "@/lib/mtnPass";

const ROTATE_MS = 6500;
// Glide time between slides; also how long before a copy is swapped for the real slide.
const GLIDE_MS = 650;

type Banner = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  // Selling points, shown as ticked chips (promos only).
  perks?: string[];
  art: string | null;
  cta: { label: string; href?: string; onClick?: () => void; mtn?: boolean };
  tone: "sun" | "art" | "paper";
};

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

function buildBanners(featured: Comic[]): Banner[] {
  const comics: Banner[] = featured.map((comic) => ({
    id: comic.uuid,
    kicker: comic.isOriginal ? "Toon Central Original" : "Popular by Indies",
    title: comic.title,
    body: clip(comic.description, 140),
    art: comic.backgroundImage || comic.coverImage,
    cta: { label: "Start reading", href: comicHref(comic.uuid) },
    tone: "art",
  }));

  const mtn: Banner = {
    id: "mtn",
    kicker: "MTN Daily Pass",
    title: `Read everything today for ₦${MTN_DAILY_PRICE}`,
    body: "Every locked chapter of every Mafiki opens for 24 hours, paid straight from your MTN airtime.",
    perks: ["24 hours of every locked chapter", "No card, no sign-up", "Cancel any time"],
    art: null,
    cta: { label: `Get 24 hours for ₦${MTN_DAILY_PRICE}`, onClick: openMtnPay, mtn: true },
    tone: "sun",
  };

  const publish: Banner = {
    id: "publish",
    kicker: "For creators",
    title: "Publish your Mafiki",
    body: "Upload Mafiki and shorts, earn from ads or credits, and get paid to your bank.",
    perks: ["Free to publish", "Earn from episode 4", "Paid to your bank"],
    art: null,
    cta: { label: "Open Creator Studio", href: "/creator/dashboard" },
    tone: "paper",
  };

  // The MTN offer leads; comics follow, with the creators' pitch partway through.
  const half = Math.ceil(comics.length / 2);
  return [mtn, ...comics.slice(0, half), publish, ...comics.slice(half)];
}

// Discover's banner, shaped like the live homepage's "Popular by ToonCentral" (a wide screen whose top
// and bottom bow inward): the MTN Daily Pass, the creators' pitch, and Toon Central's popular picks.
// It loops endlessly: a copy of the last slide sits before the first and of the first after the last,
// and landing on a copy jumps (invisibly) to the real one. Swipe, drag or use the dots.
export function PromoBanners({ featured }: { featured: Comic[] }) {
  const banners = buildBanners(featured);
  const count = banners.length;
  const looping = count > 1;
  // Track order: [last copy, ...real slides, first copy]. Positions 1..count are the real ones.
  const slides = looping ? [banners[count - 1], ...banners, banners[0]] : banners;
  const offset = looping ? 1 : 0;

  const track = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState(offset);
  const [paused, setPaused] = useState(false);
  const index = (((position - offset) % count) + count) % count;

  // A copy's real slide: the copy before the first is the last, the copy after the last is the first.
  const realPosition = useCallback((pos: number) => (!looping ? pos : pos <= 0 ? count : pos >= count + 1 ? 1 : pos), [count, looping]);

  const jumpTo = useCallback((pos: number) => {
    const list = track.current;
    if (!list) return;
    list.style.scrollSnapType = "none";
    list.scrollLeft = pos * list.clientWidth;
    list.style.scrollSnapType = "";
  }, []);

  // Glide with snapping off (turning it on mid-glide makes browsers abandon the glide), then settle
  // exactly on the slide, swapping a copy for its real slide.
  const glideTo = useCallback(
    (pos: number) => {
      const list = track.current;
      if (!list) return;
      list.style.scrollSnapType = "none";
      list.scrollTo({ left: pos * list.clientWidth, behavior: "smooth" });
      window.setTimeout(() => jumpTo(realPosition(pos)), GLIDE_MS);
    },
    [jumpTo, realPosition]
  );

  // Start on the first real slide.
  useEffect(() => {
    jumpTo(offset);
  }, [jumpTo, offset]);

  // Follow the scroll; a native (touch) swipe that comes to rest on a copy jumps to the real slide.
  useEffect(() => {
    const list = track.current;
    if (!list) return;
    let frame = 0;
    let settle = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPosition(Math.round(list.scrollLeft / list.clientWidth)));
      clearTimeout(settle);
      settle = window.setTimeout(() => {
        // A glide or drag in progress handles its own landing.
        if (list.style.scrollSnapType === "none") return;
        const pos = Math.round(list.scrollLeft / list.clientWidth);
        if (realPosition(pos) !== pos) jumpTo(realPosition(pos));
      }, 160);
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      list.removeEventListener("scroll", onScroll);
    };
  }, [jumpTo, realPosition]);

  useEffect(() => {
    if (paused || !looping) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => glideTo(position + 1), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [position, paused, looping, glideTo]);

  // Mouse drag (touch swipes scroll natively). Works on the element directly: React state lags the pointer.
  const dragFrom = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const endDrag = (clientX: number | null) => {
    const list = track.current;
    const from = dragFrom.current;
    dragFrom.current = null;
    if (!list || !from?.moved) return;
    list.style.cursor = "";
    const width = list.clientWidth;
    const dx = clientX == null ? 0 : clientX - from.x;
    const start = Math.round(from.left / width);
    // A short flick (12% of the width) is enough to move one slide.
    glideTo(Math.abs(dx) > width * 0.12 ? start - Math.sign(dx) : start);
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 0);
  };
  const drag = {
    onPointerDown: (e: React.PointerEvent<HTMLUListElement>) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || !track.current) return;
      dragFrom.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
    },
    onPointerMove: (e: React.PointerEvent<HTMLUListElement>) => {
      const list = track.current;
      const from = dragFrom.current;
      if (!list || !from) return;
      const dx = e.clientX - from.x;
      if (!from.moved) {
        if (Math.abs(dx) < 6) return;
        from.moved = true;
        list.style.scrollSnapType = "none";
        list.style.cursor = "grabbing";
        list.setPointerCapture(e.pointerId);
      }
      list.scrollLeft = from.left - dx;
    },
    onPointerUp: (e: React.PointerEvent<HTMLUListElement>) => endDrag(e.clientX),
    onPointerCancel: () => endDrag(null),
    onLostPointerCapture: (e: React.PointerEvent<HTMLUListElement>) => endDrag(e.clientX),
    // Stops the browser's own "drag this link or image" taking over the mouse.
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    // The click that ends a drag mustn't press the button under the pointer.
    onClickCapture: (e: React.MouseEvent) => {
      if (justDragged.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };

  return (
    <section
      aria-label="Highlights"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocus={() => setPaused(true)}
      className="relative mt-12"
    >
      {/* Bowed top and bottom (see .cinema-screen), like the live site. */}
      <div className="cinema-screen">
        <ul ref={track} {...drag} className="hide-scrollbar flex cursor-grab snap-x snap-mandatory overflow-x-auto select-none">
          {slides.map((banner, i) => {
            const current = i === position;
            return (
              <li
                key={`${banner.id}-${i}`}
                aria-hidden={!current}
                className={`relative min-h-[17rem] w-full shrink-0 snap-center overflow-hidden sm:min-h-[22rem] lg:min-h-[26rem] ${
                  banner.tone === "sun" ? "bg-sun text-ink" : banner.tone === "paper" ? "paper-band text-ink" : "bg-ink text-white"
                }`}
              >
                {banner.art && (
                  <>
                    <img src={cloudinary(banner.art, 1600)} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_30%]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
                  </>
                )}
                {banner.tone !== "art" && (
                  <div className="halftone-fade absolute inset-y-0 right-0 w-3/5 rotate-180 [--dot:rgba(7,11,20,0.16)]" aria-hidden="true" />
                )}
                {/* The price as a stamp, so the offer reads at a glance. */}
                {banner.cta.mtn && (
                  <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 rotate-3 border-[3px] border-black bg-ink px-6 py-4 text-center text-white shadow-[6px_6px_0_#000] md:block lg:right-20">
                    <p className="font-display text-7xl leading-none lg:text-8xl">₦{MTN_DAILY_PRICE}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-sun">for 24 hours</p>
                  </div>
                )}

                <div className="relative flex h-full min-h-[inherit] flex-col justify-center gap-2 px-5 py-9 sm:max-w-[62%] sm:gap-3 sm:px-10 sm:py-14 lg:px-16">
                  <p className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] sm:text-xs ${banner.tone === "art" ? "text-sun" : "text-ink/70"}`}>
                    {banner.cta.mtn && <IoCellular className="text-base" />} {banner.kicker}
                  </p>
                  <h2 className="font-display text-3xl uppercase leading-[0.9] sm:text-6xl lg:text-7xl">{banner.title}</h2>
                  <p className={`line-clamp-3 max-w-lg text-xs leading-5 sm:line-clamp-none sm:text-base sm:leading-6 ${banner.tone === "art" ? "text-slate-200" : "text-ink/80"}`}>
                    {banner.body}
                  </p>
                  {banner.perks && (
                    <ul className="hidden flex-wrap gap-2 sm:flex">
                      {banner.perks.map((perk) => (
                        <li key={perk} className="flex items-center gap-1.5 border-2 border-black/80 bg-white/40 px-2.5 py-1 text-xs font-bold">
                          <IoCheckmark /> {perk}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-1 sm:mt-2">
                    {banner.cta.href ? (
                      <Link
                        href={banner.cta.href}
                        tabIndex={current ? undefined : -1}
                        className={`btn gap-2 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base ${banner.tone === "art" ? "btn-primary" : "border-black bg-ink text-white hover:bg-black"}`}
                      >
                        {banner.cta.label} <IoArrowForward />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={banner.cta.onClick}
                        tabIndex={current ? undefined : -1}
                        className="btn gap-2 border-black bg-ink px-4 py-2 text-sm text-white hover:bg-black sm:px-6 sm:py-3 sm:text-base"
                      >
                        {banner.cta.mtn && <IoCellular />} {banner.cta.label} <IoArrowForward />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 flex justify-center gap-2" role="group" aria-label="Choose highlight">
        {banners.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => glideTo(i + offset)}
            aria-label={`Show ${banner.title}`}
            aria-current={i === index ? "true" : undefined}
            className={`h-2 border border-black transition-all ${i === index ? "w-8 bg-mint" : "w-2 bg-line hover:bg-slate-400"}`}
          />
        ))}
      </div>

      <MtnPayFlow />
    </section>
  );
}
