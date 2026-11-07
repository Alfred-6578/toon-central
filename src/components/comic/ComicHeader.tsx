import Link from "next/link";
import { VscNotebook } from "react-icons/vsc";
import { CreatorAvatar } from "@/components/ui/CreatorAvatar";
import { FollowButton } from "@/components/ui/FollowButton";
import { SubscribeButton } from "@/components/ui/SubscribeButton";
import type { Comic } from "@/lib/api/types";
import { cloudinary, creatorHref, genreHref, scheduleLabel, timeAgo } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";
import { EpisodeLink } from "./EpisodeLink";
import { StatBar } from "./StatBar";
import { Synopsis } from "./Synopsis";

export { readerHref } from "@/lib/format";

function freshness(comic: Comic) {
  if (comic.status === "COMPLETED") return "Completed";
  return scheduleLabel(comic) ?? (comic.lastEpisodeAt ? `Last episode ${timeAgo(comic.lastEpisodeAt)}` : "Ongoing");
}

// Full-bleed header: the banner pushed back behind halftone, the cover as a tilted comic panel.
export function ComicHeader({ comic, live = false }: { comic: Comic; live?: boolean }) {
  return (
    <section className="relative overflow-hidden border-b-2 border-line">
      <div className="absolute inset-0" aria-hidden="true">
        <img src={cloudinary(comic.backgroundImage, 1600)} alt="" fetchPriority="high" className="h-full w-full object-cover opacity-35" />
        <div className="halftone-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40 lg:bg-gradient-to-r lg:from-ink lg:via-ink/85 lg:to-ink/30" />
      </div>

      {/* Phones: a small cover beside the tags, title and creator, the rest full width under them so
          Start reading lands on the first screen. Desktop: the cover on the left of everything. */}
      <div className="relative grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-4 gap-y-5 px-4 pb-8 pt-5 [grid-template-areas:'crumb_crumb'_'cover_head'_'body_body'] sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-x-8 sm:px-6 md:px-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-0 lg:px-10 lg:pb-14 lg:pt-6 lg:[grid-template-areas:'crumb_crumb'_'cover_head'_'cover_body']">
        <nav aria-label="Breadcrumb" className="truncate text-sm text-slate-400 [grid-area:crumb] lg:mb-8">
          <Link href="/" className="hover:text-mint">Home</Link>
          <span className="mx-2 text-slate-600">/</span>
          <Link href={comic.isOriginal ? "/#originals" : "/#indies"} className="hover:text-mint">
            {comic.isOriginal ? "Originals" : "Indies"}
          </Link>
          <span className="mx-2 text-slate-600">/</span>
          <span className="text-slate-200">{comic.title}</span>
        </nav>

        <div className="-rotate-2 self-start border-[3px] border-black shadow-[5px_5px_0_var(--color-mint-deep)] [grid-area:cover] sm:shadow-[8px_8px_0_var(--color-mint-deep)] lg:w-[280px]">
          <img src={cloudinary(comic.coverImage, 700)} alt={`${comic.title} cover`} fetchPriority="high" className="aspect-[3/4] w-full object-cover" />
        </div>

        <div className="min-w-0 max-w-3xl [grid-area:head]">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className={`tag text-xs sm:text-sm ${comic.isOriginal ? "bg-sun" : "bg-paper"}`}>
              {comic.isOriginal ? "Toon Central Original" : "Indie"}
            </span>
            {comic.genres.map((genre) => (
              <Link key={genre} href={genreHref(genre)} className={`tag hover:-translate-y-px ${genreTag(genre)}`}>{genre}</Link>
            ))}
          </div>

          <h1 className="mt-3 break-words font-display text-[2rem] uppercase leading-[0.95] text-white sm:mt-4 sm:text-6xl xl:text-7xl">{comic.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-4">
            <Link href={creatorHref(comic.creator.username)} className="group inline-flex min-w-0 items-center gap-2 sm:gap-3">
              <CreatorAvatar creator={comic.creator} genre={comic.genres[0]} className="h-7 w-7 shrink-0 text-xs sm:h-9 sm:w-9 sm:text-sm" />
              <span className="truncate text-sm text-slate-300">
                by <span className="font-semibold text-white group-hover:text-mint">{comic.creator.username}</span>
              </span>
            </Link>
            <FollowButton username={comic.creator.username} creatorId={comic.creator.id} small />
          </div>
        </div>

        <div className="min-w-0 max-w-3xl [grid-area:body] lg:mt-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-300">
            <StatBar uuid={comic.uuid} title={comic.title} views={comic.views} likes={comic.likes} live={live} />
            {comic.episodes != null && (
              <span className="flex items-center gap-1.5"><VscNotebook /> {comic.episodes} {comic.episodes === 1 ? "chapter" : "chapters"}</span>
            )}
            <span className="font-semibold text-mint">{freshness(comic)}</span>
          </div>

          {comic.description && <Synopsis text={comic.description} />}

          <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-7">
            <EpisodeLink uuid={comic.uuid} episode={1} className="btn btn-primary flex-1 px-4 py-3 text-base sm:flex-none sm:px-6">Start reading</EpisodeLink>
            <SubscribeButton uuid={comic.uuid} title={comic.title} className="flex-1 sm:flex-none" />
            <a href="#episodes" className="hidden text-sm font-semibold text-slate-300 hover:text-mint sm:block">Episodes ↓</a>
          </div>
        </div>
      </div>
    </section>
  );
}
