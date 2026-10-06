import Link from "next/link";
import { CreatorAvatar } from "@/components/ui/CreatorAvatar";
import { dateParts } from "@/components/home/latest/releaseLogData";
import type { CreatorPageData } from "@/lib/api/types";
import { cloudinary, creatorHref, formatCount } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";

// Directory card: who they are, how much they've made, and a peek at their covers.
export function CreatorCard({ data }: { data: CreatorPageData }) {
  const { creator, comics, shorts, genres, stats } = data;
  const active = stats.lastActive ? dateParts(stats.lastActive) : null;
  const covers = comics.length ? comics.map((c) => ({ id: c.uuid, src: c.coverImage })) : shorts.map((s) => ({ id: s.uuid, src: s.coverImage }));
  const work = [
    stats.series > 0 && `${stats.series} series`,
    stats.series > 0 && `${formatCount(stats.reads)} reads`,
    shorts.length > 0 && `${shorts.length} ${shorts.length === 1 ? "short" : "shorts"}`,
  ].filter(Boolean);

  return (
    <Link
      href={creatorHref(creator.username)}
      className="group flex h-full flex-col border-2 border-line bg-panel p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-mint hover:shadow-[6px_6px_0_var(--color-mint-deep)]"
    >
      <div className="flex items-center gap-3">
        <CreatorAvatar creator={creator} genre={genres[0]} className="h-14 w-14 text-xl" />
        <div className="min-w-0">
          <p className="truncate font-bold text-white group-hover:text-mint">{creator.username}</p>
          <p className="mt-0.5 truncate text-xs text-slate-400">{work.join(" · ")}</p>
          {active && <p className="mt-0.5 text-[11px] text-slate-500">Active {active.month} {active.year}</p>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {covers.slice(0, 4).map((cover) => (
          <div key={cover.id} className="aspect-[3/4] overflow-hidden border-2 border-line bg-ink">
            <img src={cloudinary(cover.src, 200)} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      {genres.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {genres.slice(0, 3).map((genre) => (
            <span key={genre} className={`tag ${genreTag(genre)}`}>{genre}</span>
          ))}
        </div>
      )}
    </Link>
  );
}

// Wide card for the Toon Central studio, which leads the directory.
export function StudioCard({ data }: { data: CreatorPageData }) {
  const { creator, comics, stats } = data;

  return (
    <Link
      href={creatorHref(creator.username)}
      className="group relative block overflow-hidden border-2 border-line transition-colors hover:border-mint"
    >
      {comics[0] && (
        <div className="absolute inset-0" aria-hidden="true">
          <img src={cloudinary(comics[0].backgroundImage, 1400)} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="halftone-overlay absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        </div>
      )}

      <div className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-8">
        <div className="flex items-center gap-5">
          <CreatorAvatar creator={creator} className="h-20 w-20 -rotate-2 text-2xl shadow-[5px_5px_0_var(--color-mint-deep)]" />
          <div className="min-w-0">
            <span className="tag bg-sun">Official studio</span>
            <p className="mt-2 font-display text-4xl uppercase leading-none text-white group-hover:text-mint sm:text-5xl">Toon Central</p>
            <p className="mt-2 text-sm text-slate-300">
              {stats.series} series · {formatCount(stats.reads)} reads · the studio behind Toon Central Originals
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {comics.slice(0, 5).map((comic, i) => (
            <div
              key={comic.uuid}
              className={`w-16 shrink-0 border-2 border-black bg-ink shadow-[3px_3px_0_#000] sm:w-20 ${i % 2 ? "rotate-2" : "-rotate-2"} ${i > 2 ? "hidden sm:block" : ""}`}
            >
              <img src={cloudinary(comic.coverImage, 200)} alt="" className="aspect-[3/4] w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
