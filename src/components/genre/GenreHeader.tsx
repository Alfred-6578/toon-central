import type { Genre } from "@/lib/api/types";
import { GENRE_DETAIL_ID } from "./GenreWall";
import { comicCount } from "@/lib/format";

type GenreHeaderProps = { genre: Genre; total: number; originals: number; indies: number };

// Heads the chosen genre's results under the genre wall: the name and what's in it.
export function GenreHeader({ genre, total, originals, indies }: GenreHeaderProps) {
  return (
    <section id={GENRE_DETAIL_ID} className="px-6 pt-14 md:px-8 lg:px-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Genre</p>
      <h1 className="mt-1 font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl">{genre.name}</h1>
      <p className="mt-3 text-sm text-slate-300">
        {total === 0 ? (
          "No comics yet"
        ) : (
          <>
            <span className="font-semibold text-white">{comicCount(total)}</span>
            {originals > 0 && ` · ${originals} Toon Central ${originals === 1 ? "original" : "originals"}`}
            {indies > 0 && ` · ${indies} indie`}
          </>
        )}
      </p>
    </section>
  );
}
