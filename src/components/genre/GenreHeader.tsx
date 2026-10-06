import type { CSSProperties } from "react";
import type { Comic, Genre } from "@/lib/api/types";
import { cloudinary } from "@/lib/format";
import { genreTone } from "@/lib/tagStyles";

const toneColor = { mint: "var(--color-mint)", sun: "var(--color-sun)", paper: "var(--color-paper)" };

const fanSlots = [
  "z-20 left-1/2 -translate-x-1/2",
  "z-10 left-[4%] -rotate-[9deg]",
  "z-10 right-[4%] rotate-[9deg]",
];

type GenreHeaderProps = { genre: Genre; total: number; originals: number; indies: number; covers: Comic[] };

// Genre-coloured halftone band with the name in poster type and its three most-read covers fanned out.
export function GenreHeader({ genre, total, originals, indies, covers }: GenreHeaderProps) {
  return (
    <section
      style={{ "--dot-color": toneColor[genreTone(genre.name)] } as CSSProperties}
      className="relative overflow-hidden border-b-2 border-line"
    >
      <div className="dot-field absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative grid items-center gap-8 px-6 py-10 md:grid-cols-[minmax(0,1fr)_auto] md:px-8 lg:px-10 lg:py-14">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Genre</p>
          <h1 className="mt-2 font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl lg:text-8xl">{genre.name}</h1>
          <p className="mt-4 text-sm text-slate-300">
            {total === 0 ? (
              "No series yet"
            ) : (
              <>
                <span className="font-semibold text-white">{total} series</span>
                {originals > 0 && ` · ${originals} Toon Central ${originals === 1 ? "original" : "originals"}`}
                {indies > 0 && ` · ${indies} indie`}
              </>
            )}
          </p>
        </div>

        {covers.length > 0 && (
          <div className="relative hidden h-56 w-[380px] md:block" aria-hidden="true">
            {covers.map((comic, i) => (
              <div
                key={comic.uuid}
                className={`absolute top-0 w-[38%] border-2 border-black bg-ink shadow-[5px_5px_0_#000] ${fanSlots[i]}`}
              >
                <img src={cloudinary(comic.coverImage, 300)} alt="" className="aspect-[3/4] w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
