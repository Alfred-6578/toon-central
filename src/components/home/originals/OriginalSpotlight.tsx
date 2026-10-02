import { FaRegEye } from "react-icons/fa6";
import { IoHeartOutline } from "react-icons/io5";
import { LibraryButton } from "@/components/ui/LibraryButton";
import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref, formatCount, scheduleLabel, timeAgo } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";

function freshness(comic: Comic) {
  if (comic.status === "COMPLETED") return "Completed series";
  return scheduleLabel(comic) ?? (comic.lastEpisodeAt ? `Last episode ${timeAgo(comic.lastEpisodeAt)}` : "Ongoing");
}

// Magazine-style feature for one original: banner art as the photo, cover as a tilted inset, copy alongside.
export function OriginalSpotlight({ comic }: { comic: Comic }) {
  return (
    <article className="mb-14 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-12">
      <a href={comicHref(comic.uuid)} className="group relative block" aria-label={`Read ${comic.title}`}>
        <div className="aspect-[16/9] overflow-hidden border-[3px] border-ink bg-ink shadow-[8px_8px_0_var(--color-ink)]">
          <img
            src={cloudinary(comic.backgroundImage, 1400)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="absolute -bottom-8 left-4 w-[26%] min-w-[96px] max-w-[170px] -rotate-3 border-[3px] border-ink bg-ink shadow-[6px_6px_0_var(--color-ink)] transition-transform duration-300 group-hover:rotate-0 sm:left-6">
          <img src={cloudinary(comic.coverImage, 400)} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
        </div>
      </a>

      <div className="pt-4 lg:pt-0">
        <span className="tag -rotate-2 bg-sun text-sm">Spotlight</span>
        <h3 className="mt-3 font-display text-5xl uppercase leading-[0.95] text-ink xl:text-6xl">{comic.title}</h3>
        <p className="mt-2 text-sm text-ink/70">
          by <span className="font-semibold text-ink">{comic.creator.username}</span>
        </p>

        {comic.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {comic.genres.slice(0, 3).map((genre) => (
              <span key={genre} className={`tag border border-ink ${genreTag(genre)}`}>{genre}</span>
            ))}
          </div>
        )}

        {comic.description && <p className="mt-4 line-clamp-4 text-[15px] leading-7 text-ink/80">{comic.description}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/70">
          <span className="flex items-center gap-1.5"><FaRegEye /> {formatCount(comic.views)} reads</span>
          <span className="flex items-center gap-1.5"><IoHeartOutline /> {formatCount(comic.likes)}</span>
          <span className="font-semibold text-ink">{freshness(comic)}</span>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <a href={comicHref(comic.uuid)} className="btn btn-primary px-6 py-3 text-base">Read now</a>
          <LibraryButton uuid={comic.uuid} title={comic.title} className="h-11 w-11 text-lg" />
        </div>
      </div>
    </article>
  );
}
