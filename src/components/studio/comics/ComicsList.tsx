"use client";

import Link from "next/link";
import { useState } from "react";
import { IoAdd } from "react-icons/io5";
import { comicCount, formatCount, timeAgo } from "@/lib/format";
import { episodeState, studioHref, type StudioComic, type StudioMode } from "@/lib/studioModel";
import { useMilestoneWatch } from "@/lib/creatorTutorial";
import { useStudioComics } from "@/lib/studioStore";
import { StudioImage } from "../StudioImage";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

const matches = (filter: Filter) => (c: StudioComic) => filter === "all" || (filter === "draft" ? c.status === "draft" : c.status !== "draft");

export const STATUS_TAG: Record<StudioComic["status"], { label: string; className: string }> = {
  draft: { label: "Draft", className: "border border-dashed border-slate-400 bg-transparent text-slate-300" },
  published: { label: "Ongoing", className: "bg-mint" },
  completed: { label: "Completed", className: "bg-paper" },
};

export function ComicsList({ mode, seeds }: { mode: StudioMode; seeds: StudioComic[] }) {
  const { comics } = useStudioComics(mode, seeds);
  useMilestoneWatch(mode, comics);
  const [filter, setFilter] = useState<Filter>("all");
  const shown = comics.filter(matches(filter));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">Mafiki</h1>
          <p className="mt-2 text-sm text-slate-400">{comics.length ? comicCount(comics.length) : "Your Mafiki, episode by episode."}</p>
        </div>
        <Link href={studioHref("/creator/comics/new", mode)} data-tour="new-mafiki" className="btn btn-primary hidden gap-2 px-5 py-2.5 text-sm lg:inline-flex">
          <IoAdd /> New Mafiki
        </Link>
      </div>

      {comics.length === 0 ? (
        <div className="mt-8 border-2 border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-3xl uppercase leading-none text-white">No Mafiki yet</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">Create a Mafiki, add a cover and synopsis, then upload your first episode.</p>
          <Link href={studioHref("/creator/comics/new", mode)} className="btn btn-primary mt-6 hidden gap-2 px-6 py-3 lg:inline-flex">
            <IoAdd /> Create your first Mafiki
          </Link>
          <p className="mt-6 text-xs text-slate-500 lg:hidden">Open Studio on a computer to create one.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 flex w-fit border-2 border-line" role="group" aria-label="Show">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`px-4 py-1.5 text-sm font-semibold ${filter === value ? "bg-mint text-ink" : "text-slate-300 hover:text-white"}`}
              >
                {label} <span className={filter === value ? "text-ink/60" : "text-slate-500"}>{comics.filter(matches(value)).length}</span>
              </button>
            ))}
          </div>

          <ul className="mt-6 grid gap-3">
            {shown.map((comic) => {
              const published = comic.episodes.filter((e) => episodeState(e) === "published").length;
              const scheduled = comic.episodes.filter((e) => episodeState(e) === "scheduled").length;
              const tag = STATUS_TAG[comic.status];
              return (
                <li key={comic.id}>
                  <Link
                    href={studioHref(`/creator/comics/${comic.id}`, mode)}
                    className="group flex items-center gap-4 border-2 border-line bg-panel p-3 transition-colors hover:border-mint sm:p-4"
                  >
                    <StudioImage src={comic.cover} width={160} className="aspect-[3/4] w-14 shrink-0 border-2 border-black sm:w-16" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`tag ${tag.className}`}>{tag.label}</span>
                        {comic.genres[0] && <span className="text-xs text-slate-500">{comic.genres.join(" · ")}</span>}
                      </div>
                      <p className="mt-1 truncate font-display text-2xl uppercase leading-tight text-white group-hover:text-mint">{comic.title || "Untitled"}</p>
                      <p className="text-xs text-slate-400">
                        {published} published{scheduled > 0 && ` · ${scheduled} scheduled`}
                        {comic.episodes.length - published - scheduled > 0 && ` · ${comic.episodes.length - published - scheduled} draft`} · updated{" "}
                        {timeAgo(comic.updatedAt)}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="font-display text-2xl leading-none text-white">{formatCount(comic.reads)}</p>
                      <p className="text-xs text-slate-500">reads</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
