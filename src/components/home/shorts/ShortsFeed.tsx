"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaRegEye } from "react-icons/fa6";
import {
  IoChevronDown,
  IoChevronUp,
  IoClose,
  IoHeart,
  IoHeartOutline,
  IoPlay,
  IoVolumeHighOutline,
  IoVolumeMuteOutline,
} from "react-icons/io5";
import type { Short } from "@/lib/api/types";
import { cloudinary, cloudinaryVideo, comicHref, formatCount } from "@/lib/format";
import { useMockLikes, useMockSession } from "@/lib/mockSession";
import { genreTag } from "@/lib/tagStyles";

type ShortsFeedProps = {
  shorts: Short[];
  startIndex: number;
  onClose: () => void;
  onDuration?: (uuid: string, seconds: number) => void;
};

const iconButton =
  "flex h-11 w-11 items-center justify-center border-2 border-line bg-ink/80 text-xl text-white hover:border-mint disabled:opacity-30 disabled:hover:border-line";

// Full-screen vertical feed, Reels-style. One snap-scrolling column with a slot per short; only the
// active slot and its neighbours mount a <video> (the next one buffers), the rest are just covers.
// Portalled to <body> so transformed ancestors can't trap the fixed overlay.
export function ShortsFeed({ shorts, startIndex, onClose, onDuration }: ShortsFeedProps) {
  const feedRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const pushedHistory = useRef(false);
  const [active, setActive] = useState(startIndex);
  const activeRef = useRef(startIndex);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user, signIn } = useMockSession();
  const likes = useMockLikes();

  const slotCount = shorts.length + 1; // + the "all caught up" slot

  // Open on the tapped short without animating past the ones before it.
  useLayoutEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = startIndex * feed.clientHeight;
  }, [startIndex]);

  // Whichever slot is mostly on screen is the active one.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root: feedRef.current, threshold: 0.6 }
    );
    slotRefs.current.forEach((slot) => slot && observer.observe(slot));
    return () => observer.disconnect();
  }, [slotCount]);

  // Play the active short from the start (with sound if the browser allows), pause the rest.
  useEffect(() => {
    activeRef.current = active;
    videoRefs.current.forEach((video, i) => {
      if (video && i !== active) video.pause();
    });
    const video = videoRefs.current[active];
    if (!video) return;
    video.currentTime = 0;
    video.muted = muted;
    video.play().catch((error: DOMException) => {
      // Only a real autoplay block (not an AbortError from being paused mid-start, e.g. after a quick
      // swipe away) should fall back to muted, and only if this short is still the one on screen.
      if (error.name !== "NotAllowedError" || activeRef.current !== active) return;
      video.muted = true;
      setMuted(true);
      video.play().catch(() => {});
    });
    // Mute state carries between shorts; re-run only when the active short changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // The phone's back gesture closes the feed, and the URL names the short on screen (?short=…).
  useEffect(() => {
    if (!pushedHistory.current) {
      const url = new URL(window.location.href);
      url.searchParams.set("short", shorts[startIndex].uuid);
      window.history.pushState(window.history.state, "", url);
      pushedHistory.current = true;
    }
    const onPopState = () => onClose();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [onClose, shorts, startIndex]);

  useEffect(() => {
    const short = shorts[active];
    if (!short) return;
    const url = new URL(window.location.href);
    url.searchParams.set("short", short.uuid);
    window.history.replaceState(window.history.state, "", url);
  }, [active, shorts]);

  const close = useCallback(() => {
    // Popping our history entry fires popstate, which closes the feed and restores the old URL.
    if (pushedHistory.current) window.history.back();
    else onClose();
  }, [onClose]);

  const scrollToSlot = useCallback((index: number) => {
    const target = Math.max(0, Math.min(slotCount - 1, index));
    slotRefs.current[target]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [slotCount]);

  const togglePlay = useCallback(() => {
    const video = videoRefs.current[active];
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, [active]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    videoRefs.current.forEach((video) => {
      if (video) video.muted = next;
    });
    setMuted(next);
  }, [muted]);

  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "escape") close();
      else if (key === "arrowdown" || key === "arrowright") {
        event.preventDefault();
        scrollToSlot(active + 1);
      } else if (key === "arrowup" || key === "arrowleft") {
        event.preventDefault();
        scrollToSlot(active - 1);
      } else if (key === " " || key === "k") {
        event.preventDefault();
        togglePlay();
      } else if (key === "m") toggleMute();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, close, scrollToSlot, togglePlay, toggleMute]);

  const toggleLike = (uuid: string) => {
    if (!user) signIn();
    likes.toggle(uuid);
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Shorts" className="fixed inset-0 z-[80] bg-ink">
      <div ref={feedRef} className="hide-scrollbar h-dvh snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {shorts.map((short, i) => {
          const near = Math.abs(i - active) <= 1;
          const isActive = i === active;
          const liked = likes.has(short.uuid);

          return (
            <section
              key={short.uuid}
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              data-index={i}
              aria-label={short.title}
              className="relative h-dvh snap-start snap-always overflow-hidden"
            >
              {/* The short's own cover, blurred and halftoned, fills whatever the video doesn't */}
              <div className="absolute inset-0" aria-hidden="true">
                <img src={cloudinary(short.coverImage, 400)} alt="" loading="lazy" className="h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
                <div className="halftone-overlay absolute inset-0" />
                <div className="absolute inset-0 bg-ink/40" />
              </div>

              <div onClick={isActive ? togglePlay : undefined} className="absolute inset-0 flex items-center justify-center md:px-24 md:pb-36 md:pt-20">
                {near ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    src={cloudinaryVideo(short.video, 720)}
                    poster={cloudinary(short.coverImage, 720)}
                    playsInline
                    preload={i === active + 1 ? "auto" : "metadata"}
                    onPlay={() => isActive && setPaused(false)}
                    onPause={() => isActive && setPaused(true)}
                    onTimeUpdate={(event) => {
                      const video = event.currentTarget;
                      if (isActive) setProgress(video.duration ? video.currentTime / video.duration : 0);
                    }}
                    onDurationChange={(event) => onDuration?.(short.uuid, event.currentTarget.duration)}
                    onEnded={() => scrollToSlot(i + 1)}
                    className="max-h-full max-w-full bg-black md:border-2 md:border-black md:shadow-[8px_8px_0_var(--color-mint-deep)]"
                  />
                ) : (
                  <img src={cloudinary(short.coverImage, 720)} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                )}
                {isActive && paused && (
                  <span className="pointer-events-none absolute flex h-16 w-16 items-center justify-center border-2 border-black bg-mint text-4xl text-ink">
                    <IoPlay />
                  </span>
                )}
              </div>

              {/* Caption and actions over the bottom of the frame */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-28 sm:px-6">
                <div className="mx-auto flex max-w-3xl items-end gap-4">
                  <div className="pointer-events-auto min-w-0 flex-1">
                    {short.isSponsored && <span className="tag mb-2 bg-paper">Sponsored</span>}
                    <h2 className="line-clamp-2 font-display text-2xl uppercase leading-none text-white sm:text-3xl">{short.title}</h2>
                    <p className="mt-1.5 text-sm text-slate-300">
                      {short.isSponsored ? "Paid promotion" : <>by <span className="font-semibold text-white">{short.creator.username}</span></>}
                      <span className="ml-3 inline-flex items-center gap-1 text-slate-400"><FaRegEye /> {formatCount(short.views)}</span>
                    </p>
                    {!short.isSponsored && short.genres.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {short.genres.slice(0, 3).map((genre) => (
                          <span key={genre} className={`tag ${genreTag(genre)}`}>{genre}</span>
                        ))}
                      </div>
                    )}
                    {short.linkedComic && (
                      <a href={comicHref(short.linkedComic.uuid)} className="btn btn-primary mt-3 h-10 px-4">Read the comic →</a>
                    )}
                  </div>

                  <div className="pointer-events-auto flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleLike(short.uuid)}
                      aria-pressed={liked}
                      aria-label={liked ? "Unlike" : "Like"}
                      className={`flex h-12 w-12 flex-col items-center justify-center border-2 text-lg ${
                        liked ? "border-black bg-mint text-ink" : "border-line bg-ink/80 text-white hover:border-mint"
                      }`}
                    >
                      {liked ? <IoHeart /> : <IoHeartOutline />}
                      <span className="text-[10px] font-bold leading-none">{formatCount(short.likes + (liked ? 1 : 0))}</span>
                    </button>
                    <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className={iconButton}>
                      {muted ? <IoVolumeMuteOutline /> : <IoVolumeHighOutline />}
                    </button>
                  </div>
                </div>

                {isActive && (
                  <div className="mx-auto mt-4 h-1 max-w-3xl bg-white/15">
                    <div className="h-full bg-mint" style={{ width: `${progress * 100}%` }} />
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {/* End of the feed */}
        <section
          ref={(el) => {
            slotRefs.current[shorts.length] = el;
          }}
          data-index={shorts.length}
          className="flex h-dvh snap-start snap-always flex-col items-center justify-center gap-5 px-6 text-center"
        >
          <p className="font-display text-5xl uppercase leading-none text-white">You&apos;re all caught up</p>
          <p className="max-w-sm text-slate-400">That&apos;s every short on the homepage. There are more animated stories in the full collection.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/shorts" className="btn btn-primary px-5 py-3">Watch all shorts</a>
            <button type="button" onClick={close} className="btn btn-ghost px-5 py-3">Back to homepage</button>
          </div>
        </section>
      </div>

      {/* Fixed chrome over the feed */}
      <div className="pointer-events-none fixed inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-6">
        <p className="font-display text-xl uppercase leading-none text-white drop-shadow">
          Shorts <span className="text-slate-400">{Math.min(active + 1, shorts.length)} / {shorts.length}</span>
        </p>
        <button type="button" onClick={close} autoFocus aria-label="Close shorts" className={`pointer-events-auto ${iconButton}`}>
          <IoClose />
        </button>
      </div>

      <div className="fixed right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        <button type="button" onClick={() => scrollToSlot(active - 1)} disabled={active === 0} aria-label="Previous short" className={iconButton}>
          <IoChevronUp />
        </button>
        <button type="button" onClick={() => scrollToSlot(active + 1)} disabled={active >= shorts.length} aria-label="Next short" className={iconButton}>
          <IoChevronDown />
        </button>
      </div>
    </div>,
    document.body
  );
}
