"use client";

import { useEffect } from "react";
import { notifyFirstEpisode } from "@/lib/notifications";
import { removeProgress, saveProgress } from "@/lib/readingProgress";

type ReaderProgressProps = {
  uuid: string;
  title: string;
  coverImage: string;
  episode: number;
  // Readable pages only: under the paywall that's the free preview.
  pagesInEpisode: number;
  totalEpisodes: number | null;
};

// Records the page the reader has reached, for the homepage's "Continue reading": the page sitting a
// quarter of the way down the screen, i.e. the one being read. Pages are the <img data-page="n"> in the reader.
export function ReaderProgress({ uuid, title, coverImage, episode, pagesInEpisode, totalEpisodes }: ReaderProgressProps) {
  useEffect(() => {
    let lastSaved = "";
    let frame = 0;
    let live = true;

    const record = () => {
      // Leaving the reader, Next scrolls the next page to the top while this listener can still fire;
      // by then the reader's pages are gone, and that must not be saved as "page 1".
      const pages = [...document.querySelectorAll<HTMLElement>("[data-page]")];
      if (!live || !pages.length) return;
      const readingLine = window.innerHeight / 4;
      const current = pages.filter((p) => p.getBoundingClientRect().top <= readingLine).at(-1) ?? pages[0];
      const page = Number(current.dataset.page);
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
      const finished = atEnd && page >= pagesInEpisode;
      const hasNext = totalEpisodes != null && episode < totalEpisodes;

      const key = `${page}:${finished}`;
      if (key === lastSaved) return;
      lastSaved = key;

      // Finished the last episode: nothing left to continue.
      if (finished && totalEpisodes != null && !hasNext) return removeProgress(uuid);
      // Episode count unknown (snapshot data): we can't promise a next episode, so keep them on this one.
      saveProgress({ uuid, title, coverImage, episode, page, pagesInEpisode, totalEpisodes, finished: finished && hasNext });
      // Congratulate the first episode ever finished (once; signed-in readers only).
      if (finished) notifyFirstEpisode(title, hasNext ? `/comics/${uuid}/read/${episode + 1}` : `/comics/${uuid}`);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(record);
    };

    // A "Continue reading" link lands on #page-n: jump straight there, no smooth scroll from the top.
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });

    // Opening an episode counts as starting it, even before any scrolling.
    frame = requestAnimationFrame(record);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [uuid, title, coverImage, episode, pagesInEpisode, totalEpisodes]);

  return null;
}
