import type { Comic, Genre } from "@/lib/api/types";
import { cloudinary } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";
import { genreHref, pickFeatured, type Featured } from "./GenreWall";

function Tile({ item, className = "" }: { item: Featured; className?: string }) {
  const lead = item.covers[0];

  return (
    <a href={genreHref(item.genre)} className={`group block transition-transform duration-200 hover:-translate-y-1 ${className}`}>
      <div className="relative aspect-[3/4] overflow-hidden border-2 border-line bg-ink transition-shadow duration-200 group-hover:border-mint group-hover:shadow-[6px_6px_0_var(--color-mint-deep)]">
        <img src={cloudinary(lead.coverImage, 360)} alt="" loading="lazy" className="h-full w-full object-cover" />
        {/* Genre banner across the foot of the cover, in the genre's colour */}
        <div className={`absolute inset-x-0 bottom-0 border-t-2 border-black px-2.5 py-2 ${genreTag(item.genre.name)}`}>
          <p className="truncate font-display text-lg uppercase leading-none text-ink">{item.genre.name}</p>
        </div>
      </div>
      {item.count > 0 && <p className="mt-2 text-xs text-slate-400">{item.count} series</p>}
    </a>
  );
}

// Alternative to the genre wall: eight cover-led tiles, one row on wide screens.
export function GenreTiles({ genres, comics, counts }: { genres: Genre[]; comics: Comic[]; counts: Map<number, number> }) {
  const tiles = pickFeatured(genres, comics, counts, 8).filter((item) => item.covers.length > 0);

  return (
    <>
      <div className="hide-scrollbar -mx-6 overflow-x-auto px-6 pb-3 pt-1 sm:hidden">
        <div className="flex w-max gap-4">
          {tiles.map((item) => (
            <Tile key={item.genre.id} item={item} className="w-[40vw] max-w-[180px] shrink-0" />
          ))}
        </div>
      </div>

      <div className="hidden gap-5 pt-1 sm:grid sm:grid-cols-4 lg:grid-cols-8">
        {tiles.map((item) => (
          <Tile key={item.genre.id} item={item} />
        ))}
      </div>
    </>
  );
}
