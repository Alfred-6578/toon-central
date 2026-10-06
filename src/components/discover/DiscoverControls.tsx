"use client";

import { useRouter } from "next/navigation";
import { IoSearch, IoShuffle } from "react-icons/io5";
import { OPEN_SEARCH_EVENT } from "@/components/layout/nav/SearchPanel";
import { comicHref } from "@/lib/format";

// Looks like a search box; opens the site's search panel (same as the header button or "/").
export function DiscoverSearch() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      className="flex h-16 w-full items-center gap-4 border-2 border-mint bg-panel px-5 text-left shadow-[6px_6px_0_var(--color-mint-deep)] transition-transform hover:-translate-x-px hover:-translate-y-px"
    >
      <IoSearch className="shrink-0 text-2xl text-mint" />
      <span className="flex-1 truncate text-base text-slate-400 sm:text-lg">Search Mafiki, creators, genres…</span>
      <kbd className="hidden border border-line px-2 py-0.5 text-xs text-slate-400 md:block">/</kbd>
    </button>
  );
}

// Opens a random series.
export function SurpriseMe({ uuids }: { uuids: string[] }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(comicHref(uuids[Math.floor(Math.random() * uuids.length)]))}
      className="btn btn-primary gap-3 px-8 py-4 text-xl"
    >
      <IoShuffle className="text-2xl" /> Surprise me
    </button>
  );
}
