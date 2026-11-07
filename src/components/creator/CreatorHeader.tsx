import type { CSSProperties } from "react";
import Link from "next/link";
import { FaAt, FaInstagram, FaTiktok, FaXTwitter } from "react-icons/fa6";
import { CreatorAvatar } from "@/components/ui/CreatorAvatar";
import { FollowButton } from "@/components/ui/FollowButton";
import { CreatorBio } from "./CreatorBio";
import { dateParts } from "@/components/home/latest/releaseLogData";
import type { CreatorPageData } from "@/lib/api/types";
import { cloudinary, formatCount, genreHref } from "@/lib/format";
import { genreTag, genreTone } from "@/lib/tagStyles";

const toneColor = { mint: "var(--color-mint)", sun: "var(--color-sun)", paper: "var(--color-paper)" };
const socialIcons = { instagram: FaInstagram, tiktok: FaTiktok, x: FaXTwitter, twitter: FaXTwitter };

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="font-display text-3xl leading-none text-white sm:text-4xl">{value}</dd>
      <dt className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
    </div>
  );
}

// Profile header: their most-read banner pushed back behind halftone (or a dot field in their main
// genre colour when they only have shorts), a large avatar, credits-style stats and their socials.
// `live`: reading uses the API, so the bio is fetched from the creator's profile once the page opens.
export function CreatorHeader({ data, live = false }: { data: CreatorPageData; live?: boolean }) {
  const { creator, isOfficial, comics, shorts, genres, socials, stats } = data;
  const banner = comics[0]?.backgroundImage;
  const mainGenre = genres[0];
  const active = stats.lastActive ? dateParts(stats.lastActive) : null;

  return (
    <section
      style={{ "--dot-color": toneColor[genreTone(mainGenre ?? "")] } as CSSProperties}
      className="relative overflow-hidden border-b-2 border-line"
    >
      <div className="absolute inset-0" aria-hidden="true">
        {banner ? (
          <>
            <img src={cloudinary(banner, 1600)} alt="" fetchPriority="high" className="h-full w-full object-cover opacity-30" />
            <div className="halftone-overlay absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
          </>
        ) : (
          <div className="dot-field absolute inset-0 opacity-50" />
        )}
      </div>

      <div className="relative px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-6 md:px-8 lg:px-10 lg:pb-12">
        <nav aria-label="Breadcrumb" className="truncate text-sm text-slate-400">
          <Link href="/" className="hover:text-mint">Home</Link>
          <span className="mx-2 text-slate-600">/</span>
          <Link href="/creators" className="hover:text-mint">Creators</Link>
          <span className="mx-2 text-slate-600">/</span>
          <span className="text-slate-200">{creator.username}</span>
        </nav>

        {/* Like the comic page: on phones the avatar sits beside the label and name with the rest full
            width under them; from `sm` up it stays to the left of everything. */}
        <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-4 [grid-template-areas:'avatar_head'_'body_body'] sm:mt-8 sm:gap-x-6 sm:gap-y-0 sm:[grid-template-areas:'avatar_head'_'avatar_body']">
          <CreatorAvatar
            creator={creator}
            genre={mainGenre}
            className="h-20 w-20 -rotate-2 text-3xl shadow-[4px_4px_0_var(--color-mint-deep)] [grid-area:avatar] sm:h-36 sm:w-36 sm:text-5xl sm:shadow-[6px_6px_0_var(--color-mint-deep)]"
          />
          <div className="min-w-0 self-center [grid-area:head] sm:self-start">
            <span className={`tag text-xs sm:text-sm ${isOfficial ? "bg-sun" : "bg-paper"}`}>
              {isOfficial ? "Official Toon Central studio" : comics.length ? "Independent creator" : "Animator"}
            </span>
            <h1 className="mt-2 break-words font-display text-[2rem] uppercase leading-[0.95] text-white sm:mt-3 sm:text-6xl xl:text-7xl">
              {creator.username}
            </h1>
          </div>
          <div className="min-w-0 [grid-area:body]">
            <CreatorBio creatorId={creator.id} live={live} />
            {genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {genres.slice(0, 5).map((genre) => (
                  <Link key={genre} href={genreHref(genre)} className={`tag hover:-translate-y-px ${genreTag(genre)}`}>{genre}</Link>
                ))}
              </div>
            )}
            <div className="mt-5">
              <FollowButton username={creator.username} creatorId={creator.id} />
            </div>
          </div>
        </div>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-5 border-t-2 border-line pt-5 sm:mt-8 sm:gap-x-10 sm:pt-6">
          {stats.comics > 0 && <Stat value={String(stats.comics)} label="Mafiki" />}
          {stats.comics > 0 && <Stat value={formatCount(stats.reads)} label="Reads" />}
          {stats.chapters != null && <Stat value={String(stats.chapters)} label={stats.chapters === 1 ? "Chapter" : "Chapters"} />}
          {shorts.length > 0 && <Stat value={String(shorts.length)} label={shorts.length === 1 ? "Short" : "Shorts"} />}
          {shorts.length > 0 && <Stat value={formatCount(stats.shortViews)} label="Short views" />}
          {active && <Stat value={`${active.month} ${active.year}`} label="Last active" />}
        </dl>

        {socials.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {socials.map((social) => {
              const Icon = (social.platform && socialIcons[social.platform as keyof typeof socialIcons]) || FaAt;
              const body = (
                <>
                  <Icon className="text-base" /> @{social.handle}
                </>
              );
              const className = "flex items-center gap-2 border-2 border-line bg-ink/70 px-3 py-1.5 text-sm font-semibold text-slate-200";
              return social.url ? (
                <a key={social.handle} href={social.url} target="_blank" rel="noopener noreferrer" className={`${className} hover:border-mint hover:text-white`}>
                  {body}
                </a>
              ) : (
                <span key={social.handle} className={className}>{body}</span>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
