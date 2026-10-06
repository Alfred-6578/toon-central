"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoChevronDown, IoChevronUp, IoClose, IoVolumeHighOutline, IoVolumeMuteOutline } from "react-icons/io5";
import type { Short } from "@/lib/api/types";
import { CommentsDrawer } from "./feed/CommentsDrawer";
import { ShortSlot } from "./feed/ShortSlot";

type ShortsFeedProps = {
  shorts: Short[];
  startIndex: number;
  onClose: () => void;
  onDuration?: (uuid: string, seconds: number) => void;
  // Opened straight from a shared /shorts?short=… link: there's no earlier page entry to go back to.
  deepLinked?: boolean;
  // "overlay": the pop-up player opened from a card. "page": the /shorts page itself, sitting between
  // the site header and the phone tab bar, with no close button or history entry of its own.
  mode?: "overlay" | "page";
};

// Every open short gets a shareable address; visiting it opens that short on the shorts page.
const shortUrl = (uuid: string) => `/shorts?short=${encodeURIComponent(uuid)}`;

const iconButton =
  "flex h-11 w-11 items-center justify-center border-2 border-white/25 bg-ink/70 text-xl text-white hover:border-mint disabled:opacity-30 disabled:hover:border-white/25";

// Full-screen vertical feed, TikTok-style. One snap-scrolling column with a slot per short; only the
// active slot and its neighbours mount a <video> (the next one buffers), the rest are just covers.
// Portalled to <body> so transformed ancestors can't trap the fixed overlay.
export function ShortsFeed({ shorts, startIndex, onClose, onDuration, deepLinked = false, mode = "overlay" }: ShortsFeedProps) {
  const isPage = mode === "page";
  const feedRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const pushedHistory = useRef(false);
  const [active, setActive] = useState(startIndex);
  const activeRef = useRef(startIndex);
  const [muted, setMuted] = useState(false);
  const [commentsFor, setCommentsFor] = useState<Short | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  // The URL shows the short on screen as a shareable /shorts?short=… link. Opening the feed adds a
  // history entry, so the phone's back gesture closes it and restores the page you were on.
  useEffect(() => {
    if (isPage) return;
    if (!pushedHistory.current && !deepLinked) {
      window.history.pushState(window.history.state, "", shortUrl(shorts[startIndex].uuid));
      pushedHistory.current = true;
    }
    const onPopState = () => onClose();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [onClose, shorts, startIndex, deepLinked, isPage]);

  useEffect(() => {
    const short = shorts[active];
    if (!short) return;
    if (isPage) {
      // On the page itself, keep its other params (e.g. ?genre=) and just name the short on screen.
      const url = new URL(window.location.href);
      url.searchParams.set("short", short.uuid);
      window.history.replaceState(window.history.state, "", url);
    } else {
      window.history.replaceState(window.history.state, "", shortUrl(short.uuid));
    }
  }, [active, shorts, isPage]);

  const close = useCallback(() => {
    // Popping our history entry fires popstate, which closes the feed and restores the old URL.
    if (pushedHistory.current) {
      window.history.back();
      return;
    }
    // Arrived on a shared link: drop ?short= so a refresh doesn't reopen it.
    const url = new URL(window.location.href);
    url.searchParams.delete("short");
    window.history.replaceState(window.history.state, "", url);
    onClose();
  }, [onClose]);

  const scrollToSlot = useCallback(
    (index: number) => {
      const target = Math.max(0, Math.min(slotCount - 1, index));
      slotRefs.current[target]?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [slotCount]
  );

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

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // The phone's share sheet where there is one; otherwise copy the link.
  const share = useCallback(
    async (short: Short) => {
      const url = `${window.location.origin}${shortUrl(short.uuid)}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: short.title, text: `Watch "${short.title}" on Toon Central`, url });
          return;
        }
        await navigator.clipboard.writeText(url);
        showToast("Link copied");
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") showToast("Couldn't share this short");
      }
    },
    [showToast]
  );

  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      const key = event.key.toLowerCase();
      if (key === "escape") {
        // Close the comments first, then the player (the page version has nothing to close).
        if (commentsFor) setCommentsFor(null);
        else if (!isPage) close();
      } else if (commentsFor) {
        return;
      } else if (key === "arrowdown" || key === "arrowright") {
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
  }, [active, close, commentsFor, isPage, scrollToSlot, togglePlay, toggleMute]);

  const feed = (
    <div
      {...(isPage ? { "aria-label": "Shorts" } : { role: "dialog", "aria-modal": true, "aria-label": "Shorts" })}
      className={
        isPage
          ? // Between the fixed site header and the phone tab bar.
            "fixed inset-x-0 bottom-[calc(3.875rem+env(safe-area-inset-bottom))] top-[66px] z-30 bg-ink lg:bottom-0"
          : "fixed inset-0 z-[80] bg-ink"
      }
    >
      <div ref={feedRef} className="hide-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {shorts.map((short, i) => (
          <ShortSlot
            key={short.uuid}
            short={short}
            index={i}
            near={Math.abs(i - active) <= 1}
            isActive={i === active}
            isNext={i === active + 1}
            registerVideo={(el) => {
              videoRefs.current[i] = el;
            }}
            registerSlot={(el) => {
              slotRefs.current[i] = el;
            }}
            onNext={() => scrollToSlot(i + 1)}
            onComments={() => setCommentsFor(short)}
            onShare={() => share(short)}
            onDuration={onDuration}
          />
        ))}

        {/* End of the feed */}
        <section
          ref={(el) => {
            slotRefs.current[shorts.length] = el;
          }}
          data-index={shorts.length}
          className="flex h-full snap-start snap-always flex-col items-center justify-center gap-5 px-6 text-center"
        >
          <p className="font-display text-5xl uppercase leading-none text-white">You&apos;re all caught up</p>
          {isPage ? (
            <>
              <p className="max-w-sm text-slate-400">That&apos;s every short for now. New animated stories land here first.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => scrollToSlot(0)} className="btn btn-primary px-5 py-3">Start over</button>
                <Link href="/discover" className="btn btn-ghost px-5 py-3">Discover Mafiki</Link>
              </div>
            </>
          ) : (
            <>
              <p className="max-w-sm text-slate-400">That&apos;s every short here. There are more animated stories in the full collection.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/shorts" className="btn btn-primary px-5 py-3">Watch all shorts</Link>
                <button type="button" onClick={close} className="btn btn-ghost px-5 py-3">Close</button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Fixed chrome over the feed */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 pb-6 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-6">
        <p className="font-display text-xl uppercase leading-none text-white drop-shadow">
          Shorts <span className="text-slate-400">{Math.min(active + 1, shorts.length)} / {shorts.length}</span>
        </p>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className={iconButton}>
            {muted ? <IoVolumeMuteOutline /> : <IoVolumeHighOutline />}
          </button>
          {!isPage && (
            <button type="button" onClick={close} autoFocus aria-label="Close shorts" className={iconButton}>
              <IoClose />
            </button>
          )}
        </div>
      </div>

      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        <button type="button" onClick={() => scrollToSlot(active - 1)} disabled={active === 0} aria-label="Previous short" className={iconButton}>
          <IoChevronUp />
        </button>
        <button type="button" onClick={() => scrollToSlot(active + 1)} disabled={active >= shorts.length} aria-label="Next short" className={iconButton}>
          <IoChevronDown />
        </button>
      </div>

      {toast && (
        <div role="status" className="slide-up absolute bottom-24 left-1/2 z-[95] -translate-x-1/2 border-2 border-black bg-mint px-4 py-2 text-sm font-bold text-ink shadow-[4px_4px_0_#000]">
          {toast}
        </div>
      )}

      {commentsFor && <CommentsDrawer short={commentsFor} onClose={() => setCommentsFor(null)} />}
    </div>
  );

  return isPage ? feed : createPortal(feed, document.body);
}
