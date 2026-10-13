"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { IoClose, IoHeart, IoPlay, IoRefresh } from "react-icons/io5";
import type { Short } from "@/lib/api/types";
import { cloudinary, cloudinaryVideo, comicHref, creatorHref, formatCount, genreSlug, readerHref } from "@/lib/format";
import { useMockComments, useMockFollows, useMockLikes, useMockSavedShorts, useMockSession } from "@/lib/mockSession";
import { ActionRail } from "./ActionRail";

const DOUBLE_TAP_MS = 260;
const TIE_IN_AFTER_S = 3;
const END_CARD_SECONDS = 5;

type ShortSlotProps = {
  short: Short;
  index: number;
  near: boolean;
  isActive: boolean;
  isNext: boolean;
  registerVideo: (el: HTMLVideoElement | null) => void;
  registerSlot: (el: HTMLElement | null) => void;
  onNext: () => void;
  onComments: () => void;
  onShare: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onDuration?: (uuid: string, seconds: number) => void;
};

// Kept short so the video stays visible: creator, a one-line title and two hashtags. "more" opens the
// full title, description and every hashtag.
function Caption({ short, showTieIn, onDismissTieIn }: { short: Short; showTieIn: boolean; onDismissTieIn: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const comic = short.linkedComic;
  const tags = short.isSponsored ? [] : short.genres.map((genre) => ({ genre, label: `#${genre.replace(/[^A-Za-z0-9]+/g, "")}` }));
  const hasMore = Boolean(short.description) || tags.length > 2 || short.title.length > 40;

  return (
    <div className="pointer-events-auto max-w-md">
      {/* The tie-in card slides up a few seconds in, TikTok "anchor" style. It's in the page from the
          start (hidden) so its cover has already loaded when it appears. */}
      {comic && (
        <div
          aria-hidden={!showTieIn}
          className={`relative mb-3 w-fit max-w-full border-2 border-black bg-paper text-ink shadow-[3px_3px_0_rgba(0,0,0,0.5)] ${
            showTieIn ? "slide-up" : "invisible"
          }`}
        >
          <Link
            href={comicHref(comic.uuid)}
            tabIndex={showTieIn ? undefined : -1}
            className="flex items-center gap-2.5 py-1.5 pl-1.5 pr-10"
          >
            <img src={cloudinary(comic.coverImage, 80)} alt="" className="aspect-[3/4] w-8 shrink-0 border-2 border-ink object-cover" />
            <div className="min-w-0">
              <span className="tag bg-sun px-1 text-[9px]">From the comic</span>
              {comic.demo && <span className="tag ml-1 border border-dashed border-ink bg-transparent px-1 text-[9px]">Demo link</span>}
              <p className="truncate text-sm font-bold leading-tight">
                {comic.title} <span className="font-normal text-ink/60">· Ep 1 free</span>
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onDismissTieIn}
            tabIndex={showTieIn ? undefined : -1}
            aria-label="Hide comic card"
            className="absolute right-0 top-0 flex h-full w-9 items-center justify-center border-l-2 border-black/15 text-lg text-ink/60 hover:text-ink"
          >
            <IoClose />
          </button>
        </div>
      )}

      <p className="flex items-center gap-2 text-[15px] font-bold text-white drop-shadow">
        {short.isSponsored ? (
          <>
            <span className="tag bg-paper">Sponsored</span> Paid promotion
          </>
        ) : (
          <Link href={creatorHref(short.creator.username)} className="hover:underline">@{short.creator.username}</Link>
        )}
        <span className="text-xs font-semibold text-slate-300">· {formatCount(short.views)} views</span>
      </p>

      <p className={`mt-0.5 font-semibold text-white drop-shadow ${expanded ? "" : "truncate"}`}>{short.title}</p>

      {expanded && short.description && (
        <p className="mt-1 max-h-32 overflow-y-auto text-sm leading-5 text-slate-200 drop-shadow">{short.description}</p>
      )}

      {(tags.length > 0 || hasMore) && (
        <p className={`mt-1 flex gap-x-2 text-sm font-bold text-white drop-shadow ${expanded ? "flex-wrap" : "items-baseline overflow-hidden whitespace-nowrap"}`}>
          {(expanded ? tags : tags.slice(0, 2)).map(({ genre, label }) => (
            // Full navigation on purpose: it leaves the player for the filtered shorts page.
            <a key={genre} href={`/shorts?genre=${genreSlug(genre)}`} className="hover:text-mint">
              {label}
            </a>
          ))}
          {hasMore && (
            <button type="button" onClick={() => setExpanded((open) => !open)} className="font-bold text-slate-300 hover:text-white">
              {expanded ? "less" : "…more"}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

export function ShortSlot({ short, index, near, isActive, isNext, registerVideo, registerSlot, onNext, onComments, onShare, muted, onToggleMute, onDuration }: ShortSlotProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTieIn, setShowTieIn] = useState(false);
  // The reader closed the comic card; it stays closed until they come back to this short.
  const [tieInDismissed, setTieInDismissed] = useState(false);
  const [endCard, setEndCard] = useState<number | null>(null);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);

  const { user, signIn } = useMockSession();
  const likes = useMockLikes();
  const saves = useMockSavedShorts();
  const follows = useMockFollows();
  const { comments } = useMockComments(short.uuid);
  const liked = likes.has(short.uuid);
  const comic = short.linkedComic;

  const requireUser = () => {
    if (!user) signIn();
  };

  // Leaving a short resets its overlays for next time (adjusted during render, not in an effect).
  const [wasActive, setWasActive] = useState(isActive);
  if (wasActive !== isActive) {
    setWasActive(isActive);
    if (!isActive) {
      setShowTieIn(false);
      setTieInDismissed(false);
      setEndCard(null);
      setProgress(0);
    }
  }

  // Latest onNext without restarting the countdown every time the parent re-renders.
  const onNextRef = useRef(onNext);
  useEffect(() => {
    onNextRef.current = onNext;
  });

  // "The story continues": counts down, then moves on.
  useEffect(() => {
    if (endCard === null) return;
    if (endCard === 0) {
      onNextRef.current();
      return;
    }
    const timer = setTimeout(() => setEndCard((n) => (n === null ? null : n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [endCard]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  // One tap pauses; two quick taps like (never unlike) with a heart where you tapped.
  const onStageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      requireUser();
      if (!liked) likes.toggle(short.uuid);
      const box = event.currentTarget.getBoundingClientRect();
      const id = Date.now();
      setBursts((all) => [...all, { id, x: event.clientX - box.left, y: event.clientY - box.top }]);
      setTimeout(() => setBursts((all) => all.filter((b) => b.id !== id)), 800);
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      togglePlay();
    }, DOUBLE_TAP_MS);
  };

  const seek = (event: MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video?.duration) return;
    const box = event.currentTarget.getBoundingClientRect();
    video.currentTime = ((event.clientX - box.left) / box.width) * video.duration;
  };

  const rail = (className: string) => (
    <ActionRail
      short={short}
      liked={liked}
      saved={saves.has(short.uuid)}
      following={follows.has(short.creator.username)}
      comments={comments.length}
      playing={isActive && !paused}
      muted={muted}
      onToggleMute={onToggleMute}
      onLike={() => {
        requireUser();
        likes.toggle(short.uuid);
      }}
      onSave={() => {
        requireUser();
        saves.toggle(short.uuid);
      }}
      onFollow={() => {
        requireUser();
        follows.toggle(short.creator.username);
      }}
      onComments={onComments}
      onShare={onShare}
      className={className}
    />
  );

  return (
    <section ref={registerSlot} data-index={index} aria-label={short.title} className="relative h-full snap-start snap-always overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <img src={cloudinary(short.coverImage, 400)} alt="" loading="lazy" className="h-full w-full scale-110 object-cover opacity-30 blur-2xl" />
        <div className="halftone-overlay absolute inset-0" />
      </div>

      <div className="relative flex h-full items-center justify-center gap-6 md:pb-6 md:pt-[4.5rem]">
        {/* The stage: full screen on phones, a 9:16 frame on desktop */}
        <div className="relative h-full w-full overflow-hidden bg-black md:aspect-[9/16] md:h-full md:w-auto md:border-2 md:border-black md:shadow-[8px_8px_0_var(--color-mint-deep)]">
          <img src={cloudinary(short.coverImage, 400)} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-xl" />
          {near ? (
            <video
              ref={(el) => {
                videoRef.current = el;
                registerVideo(el);
              }}
              src={cloudinaryVideo(short.video, 720)}
              poster={cloudinary(short.coverImage, 720)}
              playsInline
              preload={isNext ? "auto" : "metadata"}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              onTimeUpdate={(event) => {
                if (!isActive) return;
                const video = event.currentTarget;
                setProgress(video.duration ? video.currentTime / video.duration : 0);
                if (video.currentTime > TIE_IN_AFTER_S) setShowTieIn(true);
              }}
              onDurationChange={(event) => onDuration?.(short.uuid, event.currentTarget.duration)}
              onEnded={() => (comic && !short.isSponsored ? setEndCard(END_CARD_SECONDS) : onNext())}
              className="relative h-full w-full object-contain"
            />
          ) : (
            <img src={cloudinary(short.coverImage, 720)} alt="" loading="lazy" className="relative h-full w-full object-contain" />
          )}

          {/* Tap layer */}
          <div onClick={onStageClick} className="absolute inset-0 cursor-pointer" aria-hidden="true">
            {bursts.map((burst) => (
              <IoHeart
                key={burst.id}
                className="heart-burst pointer-events-none absolute text-8xl text-mint drop-shadow-[4px_4px_0_#000]"
                style={{ left: burst.x, top: burst.y }}
              />
            ))}
          </div>
          {isActive && paused && endCard === null && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-black bg-mint/90 text-5xl text-ink">
              <IoPlay />
            </span>
          )}

          {/* Caption over a bottom gradient; leaves room for the phone rail on the right */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pr-20 pt-14 md:pr-4">
            <Caption short={short} showTieIn={isActive && showTieIn && !tieInDismissed} onDismissTieIn={() => setTieInDismissed(true)} />
          </div>

          {/* Scrubbable progress bar */}
          {isActive && (
            <div
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              tabIndex={-1}
              onClick={seek}
              className="group absolute inset-x-0 bottom-0 flex h-4 cursor-pointer items-end pb-[env(safe-area-inset-bottom)]"
            >
              <div className="h-1 w-full bg-white/20 transition-[height] group-hover:h-2">
                <div className="h-full bg-mint" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          )}

          {/* Beside the caption (which leaves room on its right), near the bottom like TikTok. */}
          {rail("absolute bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-3 z-10 md:hidden")}

          {/* End card for comic tie-ins */}
          {comic && endCard !== null && (
            <div className="slide-up absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-ink/90 px-6 text-center">
              <span className="tag -rotate-2 bg-sun text-sm">The story continues</span>
              {comic.demo && <span className="tag border border-dashed border-white/60 bg-transparent text-white">Demo link</span>}
              <img src={cloudinary(comic.coverImage, 360)} alt="" className="w-36 -rotate-2 border-[3px] border-black shadow-[6px_6px_0_var(--color-mint-deep)]" />
              <p className="font-display text-3xl uppercase leading-none text-white">{comic.title}</p>
              <div className="flex flex-col gap-3">
                <Link href={readerHref(comic.uuid)} className="btn btn-primary px-6 py-3 text-base">Read episode 1</Link>
                <button type="button" onClick={onNext} className="btn btn-ghost px-6 py-3 text-base">Next short ({endCard})</button>
                <button
                  type="button"
                  onClick={() => {
                    setEndCard(null);
                    const video = videoRef.current;
                    if (video) {
                      video.currentTime = 0;
                      video.play().catch(() => {});
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white"
                >
                  <IoRefresh /> Replay
                </button>
              </div>
            </div>
          )}
        </div>

        {rail("hidden shrink-0 self-end pb-10 md:flex")}
      </div>
    </section>
  );
}
