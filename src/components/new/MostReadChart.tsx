import Link from "next/link";
import { FaRegEye } from "react-icons/fa6";
import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref, formatCount } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";

// Comics ranked by total reads, as compact numbered rows: the full version of the homepage's Top 10.
// Ranks run down each column, like a printed chart. startRank is the first row's rank (page 2 starts at 31).
export function MostReadChart({ comics, startRank = 1 }: { comics: Comic[]; startRank?: number }) {
  return (
    <ol className="gap-x-8 md:columns-2 lg:columns-3">
      {comics.map((comic, index) => {
        const rank = startRank + index;
        return (
        <li key={comic.uuid} className="break-inside-avoid">
          <Link href={comicHref(comic.uuid)} className="group flex items-center gap-3 border-b-2 border-line py-2.5">
            <span className={`w-9 shrink-0 text-right font-display text-3xl leading-none ${rank <= 3 ? "text-mint" : rank <= 10 ? "text-white" : "text-slate-500"}`}>
              {rank}
            </span>
            <img
              src={cloudinary(comic.coverImage, 120)}
              alt=""
              loading="lazy"
              className="aspect-[3/4] w-10 shrink-0 border-2 border-line object-cover group-hover:border-mint"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-white group-hover:text-mint">{comic.title}</span>
              <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                {comic.genres[0] && <span className={`tag ${genreTag(comic.genres[0])}`}>{comic.genres[0]}</span>}
                <span className="truncate">{comic.creator.username}</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-300">
              <FaRegEye className="text-slate-500" /> {formatCount(comic.views)}
            </span>
          </Link>
        </li>
        );
      })}
    </ol>
  );
}
