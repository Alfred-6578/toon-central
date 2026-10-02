import type { CSSProperties } from "react";
import type { Comic, Genre } from "@/lib/api/types";
import { cloudinary } from "@/lib/format";
import { genreTag, genreTone } from "@/lib/tagStyles";

export const genreHref = (genre: Genre) => `/genres/${genre.slug}`;

export type Featured = { genre: Genre; count: number; covers: Comic[] };

// The biggest genres, each with up to three covers. No comic leads two genres, so
// AFRI DIVAZ can't front both Romance and Teen.
export function pickFeatured(genres: Genre[], comics: Comic[], counts: Map<number, number>, size = 4): Featured[] {
  const usedLeads = new Set<string>();
  const picked: Featured[] = [];
  const bySize = [...genres].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));

  for (const genre of bySize) {
    if (picked.length === size) break;
    const matches = comics.filter((c) => c.genres.includes(genre.name)).sort((a, b) => b.views - a.views);
    const lead = matches.find((c) => !usedLeads.has(c.uuid));
    // Every comic in this genre already fronts another one: skip it rather than repeat a cover.
    if (!lead) continue;
    usedLeads.add(lead.uuid);
    picked.push({
      genre,
      count: counts.get(genre.id) ?? 0,
      covers: [lead, ...matches.filter((c) => c.uuid !== lead.uuid).slice(0, 2)],
    });
  }
  return picked;
}

// Front cover centred and raised, the other two fanned out behind it; hover spreads the fan.
const fanSlots = [
  "z-20 left-1/2 -translate-x-1/2 group-hover:-translate-y-2",
  "z-10 left-[6%] -rotate-[10deg] group-hover:-translate-x-2 group-hover:-rotate-[15deg]",
  "z-10 right-[6%] rotate-[10deg] group-hover:translate-x-2 group-hover:rotate-[15deg]",
];

const toneColor = { mint: "var(--color-mint)", sun: "var(--color-sun)", paper: "var(--color-paper)" };

function FeaturedTile({ item }: { item: Featured }) {
  const color = toneColor[genreTone(item.genre.name)];
  const more = item.count - item.covers.length;

  return (
    <a
      href={genreHref(item.genre)}
      style={{ "--dot-color": color } as CSSProperties}
      className="group block w-[78vw] max-w-[340px] shrink-0 border-2 border-line bg-panel transition-transform duration-200 hover:-translate-y-1 hover:border-mint md:w-auto md:max-w-none"
    >
      <div className="relative h-60 overflow-hidden border-b-2 border-line bg-ink">
        <div className="dot-field absolute inset-0 opacity-60" />
        {item.covers.map((comic, i) => (
          <div
            key={comic.uuid}
            className={`absolute top-8 w-[34%] min-w-[92px] border-2 border-black bg-ink shadow-[5px_5px_0_#000] transition-transform duration-300 ${fanSlots[i]}`}
          >
            <img src={cloudinary(comic.coverImage, 300)} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
          </div>
        ))}
      </div>

      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-2xl uppercase leading-none text-white group-hover:text-mint">{item.genre.name}</p>
          {item.count > 0 && <p className="shrink-0 text-xs font-semibold text-slate-400">{item.count} series</p>}
        </div>
        <p className="mt-2 truncate text-xs text-slate-400">
          {item.covers.map((c) => c.title).join(" · ")}
          {more > 0 && <span className="text-slate-500"> +{more} more</span>}
        </p>
      </div>
    </a>
  );
}

type GenreWallProps = {
  genres: Genre[];
  comics: Comic[];
  counts: Map<number, number>;
  // "catalogue" when counts come from the live API; "page" when only the comics on this page were counted.
  countSource: "catalogue" | "page";
};

export function GenreWall({ genres, comics, counts, countSource }: GenreWallProps) {
  const featured = pickFeatured(genres, comics, counts);
  // Alphabetical, so local genres like Isekai/Ojemba get the same billing as Action.
  const wall = [...genres].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="hide-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
        {featured.map((item) => (
          <FeaturedTile key={item.genre.id} item={item} />
        ))}
      </div>

      {/* Phones: three rows that scroll sideways, so 33 chips don't fill the screen. Desktop: one wrapped wall. */}
      <ul className="hide-scrollbar -mx-6 mt-8 grid auto-cols-max grid-flow-col grid-rows-3 gap-2 overflow-x-auto px-6 pb-2 md:mx-0 md:flex md:flex-wrap md:gap-2.5 md:overflow-visible md:px-0 md:pb-0">
        {wall.map((genre) => {
          const count = counts.get(genre.id) ?? 0;
          return (
            <li key={genre.id}>
              <a
                href={genreHref(genre)}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-2 px-2.5 py-1.5 font-display text-base uppercase leading-none transition-transform hover:-translate-x-px hover:-translate-y-px md:px-3 md:py-2 md:text-lg ${
                  count > 0
                    ? `border-black text-ink shadow-[3px_3px_0_#000] hover:shadow-[4px_4px_0_#000] ${genreTag(genre.name)}`
                    : "border-line text-slate-300 hover:border-mint hover:text-white"
                }`}
              >
                {genre.name}
                {count > 0 && <span className="font-sans text-xs font-bold opacity-70">{count}</span>}
              </a>
            </li>
          );
        })}
      </ul>

      {countSource === "page" && (
        <p className="mt-4 text-xs text-slate-500">Counts cover the {comics.length} series featured on this page.</p>
      )}
    </>
  );
}
