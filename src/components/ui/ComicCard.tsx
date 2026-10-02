import { FaRegEye } from "react-icons/fa6";
import { IoHeartOutline } from "react-icons/io5";
import { VscNotebook } from "react-icons/vsc";
import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref, formatCount, isRecentlyUpdated } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";
import { LibraryButton } from "./LibraryButton";

export type CardTone = "dark" | "paper";

const tones = {
  dark: {
    frame: "border-line group-hover:border-mint group-hover:shadow-[6px_6px_0_var(--color-mint-deep)]",
    title: "text-white group-hover:text-mint",
    muted: "text-slate-400",
    meta: "text-slate-300",
  },
  paper: {
    frame: "border-ink shadow-[5px_5px_0_var(--color-ink)] group-hover:shadow-[7px_9px_0_var(--color-ink)]",
    title: "text-ink group-hover:underline",
    muted: "text-ink/60",
    meta: "text-ink/75",
  },
};

// Cover-first card: the 3:4 cover is shown whole with nothing printed over it; details sit in a caption below.
type ComicCardProps = {
  comic: Comic;
  tone?: CardTone;
  // Off inside the Originals section, where every card would carry it.
  showOriginalBadge?: boolean;
  className?: string;
};

export function ComicCard({ comic, tone = "dark", showOriginalBadge = true, className = "" }: ComicCardProps) {
  const t = tones[tone];
  const completed = comic.status === "COMPLETED";
  const originalBadge = showOriginalBadge && comic.isOriginal;

  return (
    <article className={`group relative transition-transform duration-200 hover:-translate-y-1 ${className}`}>
      <a href={comicHref(comic.uuid)} className="block">
        <div className={`relative aspect-[3/4] overflow-hidden border-2 bg-panel transition-shadow duration-200 ${t.frame}`}>
          <img
            src={cloudinary(comic.coverImage, 500)}
            alt={comic.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />

          {comic.hasNewEpisode ? (
            <span className="tag absolute left-2 top-2 -rotate-2 bg-sun">New ep</span>
          ) : (
            !completed && isRecentlyUpdated(comic.lastEpisodeAt) && (
              <span className="tag absolute left-2 top-2 -rotate-2 bg-sun">Updated</span>
            )
          )}

          {(originalBadge || completed) && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
              {originalBadge && <span className="tag bg-mint">Original</span>}
              {completed && <span className="tag bg-paper">Completed</span>}
            </div>
          )}
        </div>

        <div className="pt-3">
          <h3 className={`line-clamp-1 text-[15px] font-bold leading-snug ${t.title}`}>{comic.title}</h3>
          <p className={`mt-0.5 truncate text-xs ${t.muted}`}>{comic.creator.username}</p>

          {comic.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {comic.genres.slice(0, 2).map((genre) => (
                <span key={genre} className={`tag ${genreTag(genre)}`}>{genre}</span>
              ))}
            </div>
          )}

          <div className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${t.meta}`}>
            {comic.episodes != null && (
              <span className="flex items-center gap-1"><VscNotebook /> {comic.episodes} ch</span>
            )}
            <span className="flex items-center gap-1"><FaRegEye /> {formatCount(comic.views)}</span>
            <span className="flex items-center gap-1"><IoHeartOutline /> {formatCount(comic.likes)}</span>
          </div>
        </div>
      </a>

      {/* Sits outside the link so it isn't a button nested in an anchor */}
      <LibraryButton uuid={comic.uuid} title={comic.title} className="absolute right-2 top-2" />
    </article>
  );
}
