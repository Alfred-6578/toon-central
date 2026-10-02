"use client";

import { useEffect, useState } from "react";
import { FaRegEye } from "react-icons/fa6";
import { IoClose, IoSearch } from "react-icons/io5";
import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref, formatCount } from "@/lib/format";

type Results = { query: string; comics: Comic[] };

export function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounced search; anything under 2 characters asks for what's trending instead.
  useEffect(() => {
    if (!open) return;
    const q = query.trim().length >= 2 ? query.trim() : "";
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: { comics: Comic[] }) => setResults({ query: q, comics: data.comics }))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, q ? 200 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const searching = Boolean(results?.query);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-ink/95" role="dialog" aria-modal="true" aria-label="Search">
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-6 md:pt-16">
        <div className="flex items-center gap-3">
          <label className="flex h-14 flex-1 items-center gap-3 border-2 border-mint bg-panel px-4 shadow-[5px_5px_0_var(--color-mint-deep)]">
            <IoSearch className="shrink-0 text-xl text-mint" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search comics, creators, genres"
              className="h-full w-full bg-transparent text-base text-white placeholder:text-slate-500 outline-none"
            />
          </label>
          <button type="button" onClick={onClose} aria-label="Close search" className="text-3xl text-slate-300 hover:text-white">
            <IoClose />
          </button>
        </div>

        <div className="mt-8 flex items-end justify-between border-b-2 border-line pb-2">
          <p className="font-display text-xl uppercase leading-none text-white">
            {searching ? `Results for “${results!.query}”` : "Trending right now"}
          </p>
          {loading && <span className="text-xs text-slate-400">Searching…</span>}
        </div>

        {results && results.comics.length === 0 && (
          <p className="mt-6 text-sm text-slate-400">
            Nothing matches “{results.query}”. Try a creator like 47STUDIOS or a genre like Fantasy.
          </p>
        )}

        <ul className="mt-2">
          {results?.comics.map((comic) => (
            <li key={comic.uuid}>
              <a href={comicHref(comic.uuid)} onClick={onClose} className="group flex items-center gap-4 border-b-2 border-line py-3">
                <img
                  src={cloudinary(comic.coverImage, 160)}
                  alt=""
                  className="h-16 w-12 shrink-0 border-2 border-line object-cover group-hover:border-mint"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white group-hover:text-mint">{comic.title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    by {comic.creator.username}
                    {comic.genres.length > 0 && ` · ${comic.genres.slice(0, 2).join(", ")}`}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                  <FaRegEye /> {formatCount(comic.views)}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-6 hidden text-xs text-slate-500 md:block">
          Press <kbd className="border border-line px-1.5 py-0.5 text-slate-300">/</kbd> or{" "}
          <kbd className="border border-line px-1.5 py-0.5 text-slate-300">⌘K</kbd> anywhere to search ·{" "}
          <kbd className="border border-line px-1.5 py-0.5 text-slate-300">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
