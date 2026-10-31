"use client";

import Link from "next/link";
import { useState } from "react";
import { IoBookmark, IoClose, IoPlay } from "react-icons/io5";
import { ComicCard } from "@/components/ui/ComicCard";
import { CreatorAvatar } from "@/components/ui/CreatorAvatar";
import { Pagination } from "@/components/ui/Pagination";
import type { Comic, Short } from "@/lib/api/types";
import { cloudinary, cloudinaryTransform, comicCount, comicHref, creatorHref, formatCount, timeAgo } from "@/lib/format";
import { useMockFollows, useMockLibrary, useMockSavedShorts, useMockSession } from "@/lib/mockSession";
import { PAGE_SIZES, paginate } from "@/lib/pagination";
import { authHref } from "@/lib/auth";
import { LIBRARY_TABS, SAVED_SORTS, type FollowedCreator, type LibraryTab, type SavedSort } from "@/lib/library";
import { clearProgress, removeProgress, resumeTarget, useReadingProgress, type ReadingProgress } from "@/lib/readingProgress";

type LibraryViewProps = {
  tab: LibraryTab;
  sort: SavedSort;
  page: number;
  comics: Comic[];
  shorts: Short[];
  creators: FollowedCreator[];
};

const tabHref = (tab: LibraryTab, sort?: SavedSort) => {
  const params = new URLSearchParams();
  if (tab !== "saved") params.set("tab", tab);
  if (sort && sort !== "recent") params.set("sort", sort);
  const search = params.toString();
  return `/library${search ? `?${search}` : ""}`;
};

// The reader's shelf. Everything saved lives in this browser for now, so the lists are picked out of
// the catalogue here, after the page loads.
export function LibraryView({ tab, sort, page, comics, shorts, creators }: LibraryViewProps) {
  const { user } = useMockSession();
  const library = useMockLibrary();
  const savedShorts = useMockSavedShorts();
  const follows = useMockFollows();
  const history = useReadingProgress();

  const byUuid = new Map(comics.map((c) => [c.uuid, c]));
  const progressByComic = new Map(history.map((p) => [p.uuid, p]));

  // Saved ids that still exist in the catalogue, newest save first.
  const savedComics = [...library.ids].reverse().flatMap((id) => byUuid.get(id) ?? []);
  const savedShortList = [...savedShorts.ids].reverse().flatMap((id) => shorts.find((s) => s.uuid === id) ?? []);
  const followed = follows.ids.flatMap((name) => creators.find((c) => c.creator.username === name) ?? []);

  const counts: Record<LibraryTab, number> = {
    saved: savedComics.length,
    history: history.length,
    shorts: savedShortList.length,
    following: followed.length,
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl">Your library</h1>
          <p className="mt-3 text-sm text-slate-300">
            {comicCount(counts.saved)} · {counts.shorts} {counts.shorts === 1 ? "short" : "shorts"} · following {counts.following}
          </p>
        </div>
      </div>

      {!user && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-2 border-dashed border-line px-5 py-4">
          <p className="text-sm text-slate-300">
            <span className="font-bold text-white">Saved on this device only.</span> Sign in to keep your library on every phone and laptop.
          </p>
          <Link href={authHref("signin", "/library")} className="btn btn-primary px-5 py-2 text-sm">Sign in</Link>
        </div>
      )}

      <nav aria-label="Library sections" className="hide-scrollbar -mx-6 mt-8 overflow-x-auto px-6 md:mx-0 md:px-0">
        <div className="flex w-max gap-2 border-b-2 border-line md:w-auto">
          {LIBRARY_TABS.map(({ value, label }) => {
            const active = value === tab;
            return (
              <Link
                key={value}
                href={tabHref(value)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`-mb-0.5 flex items-center gap-2 border-2 px-4 py-2.5 font-display text-base uppercase tracking-wide ${
                  active ? "border-line border-b-ink bg-ink text-white" : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {label}
                <span className={`min-w-6 px-1.5 py-0.5 text-center font-sans text-xs font-bold ${active ? "bg-mint text-ink" : "bg-panel text-slate-400"}`}>
                  {counts[value]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-8">
        {tab === "saved" && <SavedComics comics={savedComics} sort={sort} page={page} progress={progressByComic} />}
        {tab === "history" && <History history={history} byUuid={byUuid} />}
        {tab === "shorts" && <SavedShorts shorts={savedShortList} page={page} onRemove={savedShorts.toggle} />}
        {tab === "following" && <Following creators={followed} onUnfollow={follows.toggle} />}
      </div>
    </>
  );
}

function Empty({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return (
    <div className="border-2 border-line bg-panel px-6 py-14 text-center">
      <p className="font-display text-3xl uppercase leading-none text-white">{title}</p>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">{body}</p>
      <Link href={href} className="btn btn-primary mt-6 px-6 py-3 text-base">{action}</Link>
    </div>
  );
}

const sorters: Record<SavedSort, ((a: Comic, b: Comic) => number) | null> = {
  recent: null,
  updated: (a, b) => (b.lastEpisodeAt ?? "").localeCompare(a.lastEpisodeAt ?? ""),
  az: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
};

function SavedComics({ comics, sort, page, progress }: { comics: Comic[]; sort: SavedSort; page: number; progress: Map<string, ReadingProgress> }) {
  if (!comics.length) {
    return (
      <Empty
        title="Nothing saved yet"
        body="Tap the bookmark on any Mafiki and it lands here, ready for when the next episode drops."
        href="/discover"
        action="Find something to read"
      />
    );
  }

  const sorter = sorters[sort];
  const sorted = sorter ? [...comics].sort(sorter) : comics;
  const result = paginate(sorted, page, PAGE_SIZES.comics);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" role="group" aria-label="Sort by">
        <span className="text-slate-500">Sort:</span>
        {SAVED_SORTS.map(({ value, label }) => (
          <Link
            key={value}
            href={tabHref("saved", value)}
            scroll={false}
            aria-current={sort === value ? "true" : undefined}
            className={`border-b-2 pb-0.5 font-semibold ${sort === value ? "border-mint text-white" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5">
        {result.items.map((comic) => (
          <div key={comic.uuid}>
            <ComicCard comic={comic} />
            <ReadNext comic={comic} progress={progress.get(comic.uuid)} />
          </div>
        ))}
      </div>

      <Pagination result={result} baseHref={tabHref("saved", sort)} noun="Mafiki" />
    </>
  );
}

// Under each saved cover: where reading picks up, and whether new episodes came out since.
function ReadNext({ comic, progress }: { comic: Comic; progress: ReadingProgress | undefined }) {
  if (!progress) {
    return (
      <Link href={`/comics/${comic.uuid}/read/1`} className="mt-3 flex items-center gap-1.5 text-sm font-bold text-slate-300 hover:text-mint">
        <IoPlay className="text-xs" /> Start reading
      </Link>
    );
  }

  const { episode, page } = resumeTarget(progress);
  const total = progress.totalEpisodes ?? comic.episodes;
  const ahead = total != null ? total - progress.episode : 0;

  return (
    <div className="mt-3">
      <Link
        href={`/comics/${comic.uuid}/read/${episode}${page > 1 ? `#page-${page}` : ""}`}
        className="flex items-center gap-1.5 text-sm font-bold text-mint hover:underline hover:underline-offset-4"
      >
        <IoPlay className="text-xs" /> {progress.finished ? `Start episode ${episode}` : `Continue episode ${episode}`}
      </Link>
      {ahead > 1 && <p className="mt-1 text-xs text-sun">{ahead} episodes ahead of you</p>}
    </div>
  );
}

function History({ history, byUuid }: { history: ReadingProgress[]; byUuid: Map<string, Comic> }) {
  const [confirming, setConfirming] = useState(false);

  if (!history.length) {
    return (
      <Empty
        title="No reading history"
        body="Every Mafiki you open shows up here with the page you stopped on."
        href="/discover"
        action="Start reading"
      />
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Most recent first. This is also what feeds Continue reading on the homepage.</p>
        {confirming ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-300">Clear all {history.length}?</span>
            <button
              type="button"
              onClick={() => {
                clearProgress();
                setConfirming(false);
              }}
              className="border-2 border-black bg-sun px-3 py-1.5 font-bold text-ink shadow-[2px_2px_0_#000]"
            >
              Yes, clear
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="px-2 py-1.5 font-semibold text-slate-400 hover:text-white">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="text-sm font-semibold text-slate-400 underline-offset-4 hover:text-white hover:underline">
            Clear history
          </button>
        )}
      </div>

      <ol className="grid gap-3 lg:grid-cols-2">
        {history.map((p) => {
          const { episode, page } = resumeTarget(p);
          const comic = byUuid.get(p.uuid);
          return (
            <li key={p.uuid} className="relative flex border-2 border-line bg-panel transition-colors hover:border-mint">
              <Link href={comicHref(p.uuid)} className="shrink-0" aria-label={p.title}>
                <img
                  src={cloudinaryTransform(p.coverImage, "c_fill,w_144,h_192,g_north,q_auto,f_auto")}
                  alt=""
                  width={72}
                  height={96}
                  loading="lazy"
                  className="h-24 w-[72px] border-r-2 border-line object-cover"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-2 pr-10">
                <Link href={comicHref(p.uuid)} className="truncate font-display text-xl uppercase leading-tight text-white hover:text-mint">
                  {p.title}
                </Link>
                <p className="text-xs text-slate-400">
                  {p.finished ? `Finished episode ${p.episode}` : `Episode ${p.episode} · page ${p.page} of ${p.pagesInEpisode}`}
                  {" · "}
                  {timeAgo(new Date(p.updatedAt).toISOString())}
                  {comic?.genres[0] && <> · {comic.genres[0]}</>}
                </p>
                <Link
                  href={`/comics/${p.uuid}/read/${episode}${page > 1 ? `#page-${page}` : ""}`}
                  className="flex w-fit items-center gap-1.5 text-sm font-bold text-mint hover:underline hover:underline-offset-4"
                >
                  <IoPlay className="text-xs" /> {p.finished ? `Start episode ${episode}` : "Resume"}
                </Link>
              </div>
              <button
                type="button"
                onClick={() => removeProgress(p.uuid)}
                aria-label={`Remove ${p.title} from history`}
                title="Remove"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center text-slate-500 hover:text-white"
              >
                <IoClose />
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function SavedShorts({ shorts, page, onRemove }: { shorts: Short[]; page: number; onRemove: (id: string) => void }) {
  if (!shorts.length) {
    return (
      <Empty
        title="No saved shorts"
        body="Hit save on a short in the feed to keep it here for later."
        href="/shorts"
        action="Watch shorts"
      />
    );
  }

  const result = paginate(shorts, page, PAGE_SIZES.shorts);

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {result.items.map((short) => (
          <li key={short.uuid} className="group relative">
            <Link href={`/shorts?short=${short.uuid}`} className="block">
              <div className="relative aspect-[9/16] overflow-hidden border-2 border-line bg-panel transition-colors group-hover:border-mint">
                <img src={cloudinary(short.coverImage, 360)} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="tag absolute bottom-2 left-2 bg-ink/85 text-white">{formatCount(short.views)} views</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-mint">{short.title}</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">{short.creator.username}</p>
            </Link>
            <button
              type="button"
              onClick={() => onRemove(short.uuid)}
              aria-label={`Remove ${short.title} from saved shorts`}
              title="Remove"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center border-2 border-black bg-mint text-ink"
            >
              <IoBookmark />
            </button>
          </li>
        ))}
      </ul>
      <Pagination result={result} baseHref={tabHref("shorts")} noun="shorts" />
    </>
  );
}

function Following({ creators, onUnfollow }: { creators: FollowedCreator[]; onUnfollow: (id: string) => void }) {
  if (!creators.length) {
    return (
      <Empty
        title="Not following anyone"
        body="Follow creators from their shorts or profile to see who's new on the shelf."
        href="/creators"
        action="Browse creators"
      />
    );
  }

  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {creators.map(({ creator, comics, shorts, lastActive, latest }) => (
        <li key={creator.username} className="flex flex-col border-2 border-line bg-panel p-4">
          <div className="flex items-center gap-3">
            <Link href={creatorHref(creator.username)}>
              <CreatorAvatar creator={creator} className="h-12 w-12 text-lg" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={creatorHref(creator.username)} className="block truncate font-display text-xl uppercase leading-tight text-white hover:text-mint">
                {creator.username}
              </Link>
              <p className="text-xs text-slate-400">
                {[comics && comicCount(comics), shorts && `${shorts} ${shorts === 1 ? "short" : "shorts"}`].filter(Boolean).join(" · ")}
                {lastActive && ` · active ${timeAgo(lastActive)}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUnfollow(creator.username)}
              className="shrink-0 border-2 border-line px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-white hover:text-white"
            >
              Following
            </button>
          </div>

          {latest.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {latest.map((c) => (
                <Link key={c.uuid} href={comicHref(c.uuid)} title={c.title} className="block border-2 border-black transition-transform hover:-translate-y-0.5">
                  <img src={cloudinary(c.coverImage, 240)} alt={c.title} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                </Link>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
