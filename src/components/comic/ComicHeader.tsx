import Link from "next/link";
import { VscNotebook } from "react-icons/vsc";
import { CreatorAvatar } from "@/components/ui/CreatorAvatar";
import { FollowButton } from "@/components/ui/FollowButton";
import { SubscribeButton } from "@/components/ui/SubscribeButton";
import type { Comic } from "@/lib/api/types";
import { cloudinary, creatorHref, genreHref, readerHref, scheduleLabel, timeAgo } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";
import { StatBar } from "./StatBar";
import { Synopsis } from "./Synopsis";

export { readerHref } from "@/lib/format";

function freshness(comic: Comic) {
  if (comic.status === "COMPLETED") return "Completed";
  return scheduleLabel(comic) ?? (comic.lastEpisodeAt ? `Last episode ${timeAgo(comic.lastEpisodeAt)}` : "Ongoing");
}

// Full-bleed header: the banner pushed back behind halftone, the cover as a tilted comic panel.
export function ComicHeader({ comic }: { comic: Comic }) {
  return (
    <section className="relative overflow-hidden border-b-2 border-line">
      <div className="absolute inset-0" aria-hidden="true">
        <img src={cloudinary(comic.backgroundImage, 1600)} alt="" fetchPriority="high" className="h-full w-full object-cover opacity-35" />
        <div className="halftone-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40 lg:bg-gradient-to-r lg:from-ink lg:via-ink/85 lg:to-ink/30" />
      </div>

      <div className="relative grid gap-8 px-6 pb-10 pt-6 md:px-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-12 lg:px-10 lg:pb-14">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-400 lg:col-span-2">
          <Link href="/" className="hover:text-mint">Home</Link>
          <span className="mx-2 text-slate-600">/</span>
          <Link href={comic.isOriginal ? "/#originals" : "/#indies"} className="hover:text-mint">
            {comic.isOriginal ? "Originals" : "Indies"}
          </Link>
          <span className="mx-2 text-slate-600">/</span>
          <span className="text-slate-200">{comic.title}</span>
        </nav>

        <div className="w-[48vw] max-w-[220px] -rotate-2 border-[3px] border-black shadow-[8px_8px_0_var(--color-mint-deep)] sm:max-w-[240px] lg:w-[280px] lg:max-w-none">
          <img src={cloudinary(comic.coverImage, 700)} alt={`${comic.title} cover`} fetchPriority="high" className="aspect-[3/4] w-full object-cover" />
        </div>

        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`tag text-sm ${comic.isOriginal ? "bg-sun" : "bg-paper"}`}>
              {comic.isOriginal ? "Toon Central Original" : "Indie"}
            </span>
            {comic.genres.map((genre) => (
              <Link key={genre} href={genreHref(genre)} className={`tag hover:-translate-y-px ${genreTag(genre)}`}>{genre}</Link>
            ))}
          </div>

          <h1 className="mt-4 font-display text-5xl uppercase leading-[0.95] text-white sm:text-6xl xl:text-7xl">{comic.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={creatorHref(comic.creator.username)} className="group inline-flex items-center gap-3">
              <CreatorAvatar creator={comic.creator} genre={comic.genres[0]} className="h-9 w-9 text-sm" />
              <span className="text-sm text-slate-300">
                by <span className="font-semibold text-white group-hover:text-mint">{comic.creator.username}</span>
              </span>
            </Link>
            <FollowButton username={comic.creator.username} small />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-300">
            <StatBar uuid={comic.uuid} title={comic.title} views={comic.views} likes={comic.likes} />
            {comic.episodes != null && (
              <span className="flex items-center gap-1.5"><VscNotebook /> {comic.episodes} {comic.episodes === 1 ? "chapter" : "chapters"}</span>
            )}
            <span className="font-semibold text-mint">{freshness(comic)}</span>
          </div>

          {comic.description && <Synopsis text={comic.description} />}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={readerHref(comic.uuid)} className="btn btn-primary flex-1 px-6 py-3 text-base sm:flex-none">Start reading</Link>
            <SubscribeButton uuid={comic.uuid} title={comic.title} className="flex-1 sm:flex-none" />
            <a href="#episodes" className="hidden text-sm font-semibold text-slate-300 hover:text-mint sm:block">Episodes ↓</a>
          </div>
        </div>
      </div>
    </section>
  );
}
