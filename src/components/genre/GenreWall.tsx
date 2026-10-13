import Link from "next/link";
import type { Comic, Genre } from "@/lib/api/types";
import { cloudinary, comicCount, genreHref } from "@/lib/format";
import { genreColor } from "@/lib/tagStyles";

// The genre header below the wall; tiles land there so the reader sees the genre, not the wall again.
export const GENRE_DETAIL_ID = "genre-detail";

// The biggest genres get a picture tile in a mosaic of tall and wide shapes; the rest are plain name tags.
// Shapes are chosen so the grid has no holes. Desktop (4 columns, 3 rows):
//   [ 0 tall ][ 1      ][ 2      ][ 3 tall ]
//   [   0    ][ 4 wide          ][   3    ]
//   [ 5 wide          ][ 6      ][ 7      ]
// Phones (2 columns) show 0, 1, 2 and 4 the same way; 3, 5, 6 and 7 move into the name tags.
const FEATURED = 8;
const shapes = [
  "row-span-2",
  "",
  "",
  "hidden md:block md:row-span-2",
  "col-span-2",
  "hidden md:block md:col-span-2",
  "hidden md:block",
  "hidden md:block",
];
const hiddenOnPhones = (i: number) => shapes[i].startsWith("hidden");

type Tile = { genre: Genre; count: number; art: string | null };

type GenreWallProps = { genres: Genre[]; comics: Comic[]; counts: Map<number, number>; current: number };

// Every genre that has comics, at a glance: picture tiles for the biggest four, name tags for the rest,
// all real links with real counts. Genres with nothing in them yet are left out rather than dead ends.
export function GenreWall({ genres, comics, counts, current }: GenreWallProps) {
  const byReads = [...comics].sort((a, b) => b.views - a.views);
  const sized = genres
    .map((genre) => ({ genre, count: counts.get(genre.id) ?? 0 }))
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count || a.genre.name.localeCompare(b.genre.name));

  // Small genres share the same few comics, so pick by picture: no image is used twice while another is free.
  const used = new Set<string>();
  const tiles: Tile[] = sized.map(({ genre, count }, i) => {
    if (i >= FEATURED) return { genre, count, art: null };
    // Covers first: banners are mostly title lettering, which crops to fragments like "UNTE".
    const inGenre = byReads.filter((c) => c.genres.includes(genre.name));
    const images = [...inGenre.map((c) => c.coverImage), ...inGenre.map((c) => c.backgroundImage)];
    const art = images.find((src) => src && !used.has(src)) ?? images.find(Boolean) ?? null;
    if (art) used.add(art);
    return { genre, count, art };
  });

  const featured = tiles.slice(0, FEATURED);
  // Name tags: every genre without a picture tile, plus (on phones only) the tiles phones don't show.
  const tags = [
    ...featured.flatMap((tile, i) => (hiddenOnPhones(i) ? [{ tile, phoneOnly: true }] : [])),
    ...tiles.slice(FEATURED).map((tile) => ({ tile, phoneOnly: false })),
  ];
  const totalComics = new Set(comics.map((c) => c.uuid)).size;

  return (
    <section aria-labelledby="genre-wall-title" className="px-6 pt-10 md:px-8 lg:px-10 lg:pt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-line pb-3">
        <h2 id="genre-wall-title" className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">
          Genres
        </h2>
        <p className="pb-1 text-sm text-slate-400">
          {sized.length} genres · {totalComics} Mafiki
        </p>
      </div>

      <ul className="grid auto-rows-[9rem] grid-cols-2 gap-3 sm:auto-rows-[11rem] md:grid-cols-4 md:gap-4 lg:auto-rows-[12rem]">
        {featured.map((tile, i) => (
          <li key={tile.genre.id} className={shapes[i]}>
            <FeatureTile tile={tile} active={tile.genre.id === current} tall={shapes[i].includes("row-span-2")} />
          </li>
        ))}
      </ul>

      {tags.length > 0 && (
        <ul className="hide-scrollbar -mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          {tags.map(({ tile: { genre, count }, phoneOnly }) => {
            const active = genre.id === current;
            return (
              <li key={genre.id} className={`shrink-0 ${phoneOnly ? "md:hidden" : ""}`}>
                <Link
                  href={`${genreHref(genre.name)}#${GENRE_DETAIL_ID}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-baseline gap-2 whitespace-nowrap border-2 px-3 py-1.5 font-display text-base uppercase leading-none ${
                    active ? "border-black bg-mint text-ink shadow-[3px_3px_0_#000]" : "border-line text-slate-200 hover:border-mint hover:text-white"
                  }`}
                >
                  {genre.name}
                  <span className={`font-sans text-xs font-semibold ${active ? "text-ink/70" : "text-slate-500"}`}>{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FeatureTile({ tile, active, tall }: { tile: Tile; active: boolean; tall: boolean }) {
  const { genre, count, art } = tile;
  return (
    <Link
      href={`${genreHref(genre.name)}#${GENRE_DETAIL_ID}`}
      aria-current={active ? "page" : undefined}
      className={`group relative block h-full overflow-hidden border-2 bg-panel transition-colors ${
        active ? "border-mint" : "border-black hover:border-white"
      }`}
    >
      {art && (
        <img
          src={cloudinary(art, tall ? 640 : 560)}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[50%_30%] brightness-75 saturate-50 transition duration-500 group-hover:scale-105 group-hover:brightness-90 group-hover:saturate-100"
        />
      )}
      {/* The genre's colour washed over the art; it eases off on hover to show the real artwork. */}
      <div
        aria-hidden="true"
        style={{ backgroundColor: genreColor(genre.name) }}
        className="absolute inset-0 opacity-60 mix-blend-color transition-opacity duration-500 group-hover:opacity-20"
      />
      {/* Shade under the name so it stays readable on light art. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <p className={`font-display uppercase leading-none text-white ${tall ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}>{genre.name}</p>
        <p className="mt-1 text-xs font-semibold text-white/70">{comicCount(count)}</p>
      </div>

      {active && <span className="tag absolute right-2 top-2 bg-mint">Viewing</span>}
    </Link>
  );
}
