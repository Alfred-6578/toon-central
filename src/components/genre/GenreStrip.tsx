"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Genre } from "@/lib/api/types";
import { genreHref } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";

// Every genre in one sideways strip for hopping between them; the current one is scrolled into view.
export function GenreStrip({ genres, current }: { genres: Genre[]; current: number }) {
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [current]);

  return (
    <nav aria-label="All genres" className="hide-scrollbar -mx-6 overflow-x-auto px-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
      <ul className="flex w-max gap-2 py-1">
        {[...genres]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((genre) => {
            const active = genre.id === current;
            return (
              <li key={genre.id}>
                <Link
                  ref={active ? activeRef : undefined}
                  href={genreHref(genre.name)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex whitespace-nowrap border-2 px-3 py-1.5 font-display text-base uppercase leading-none ${
                    active
                      ? `border-black text-ink shadow-[3px_3px_0_#000] ${genreTag(genre.name)}`
                      : "border-line text-slate-300 hover:border-mint hover:text-white"
                  }`}
                >
                  {genre.name}
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
