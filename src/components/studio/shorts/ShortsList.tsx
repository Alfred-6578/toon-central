"use client";

import Link from "next/link";
import { useState } from "react";
import { IoAdd, IoBookOutline } from "react-icons/io5";
import { formatCount, formatDuration, timeAgo } from "@/lib/format";
import { shortState, studioHref, type StudioComic, type StudioMode, type StudioShort } from "@/lib/studioModel";
import { useStudioComics, useStudioShorts } from "@/lib/studioStore";
import { StudioImage } from "../StudioImage";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

const matches = (filter: Filter) => (s: StudioShort) =>
  filter === "all" || (filter === "draft" ? shortState(s) === "draft" : shortState(s) !== "draft");

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function ShortsList({ mode, seeds, comicSeeds }: { mode: StudioMode; seeds: StudioShort[]; comicSeeds: StudioComic[] }) {
  const { shorts } = useStudioShorts(mode, seeds);
  const { comics } = useStudioComics(mode, comicSeeds);
  const [filter, setFilter] = useState<Filter>("all");
  const shown = shorts.filter(matches(filter));
  const comicTitle = (id: string | null) => (id ? comics.find((c) => c.id === id)?.title ?? null : null);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">Shorts</h1>
          <p className="mt-2 text-sm text-slate-400">
            {shorts.length ? `${shorts.length} ${shorts.length === 1 ? "short" : "shorts"}` : "Animated videos for the shorts feed."}
          </p>
        </div>
        <Link href={studioHref("/creator/shorts/new", mode)} className="btn btn-primary hidden gap-2 px-5 py-2.5 text-sm lg:inline-flex">
          <IoAdd /> Upload short
        </Link>
      </div>

      {shorts.length === 0 ? (
        <div className="mt-8 border-2 border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-3xl uppercase leading-none text-white">No shorts yet</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
            A trailer or animated scene from your Mafiki is the quickest way to bring new readers in.
          </p>
          <Link href={studioHref("/creator/shorts/new", mode)} className="btn btn-primary mt-6 hidden gap-2 px-6 py-3 lg:inline-flex">
            <IoAdd /> Upload your first short
          </Link>
          <p className="mt-6 text-xs text-slate-500 lg:hidden">Open Studio on a computer to upload one.</p>
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
                {label} <span className={filter === value ? "text-ink/60" : "text-slate-500"}>{shorts.filter(matches(value)).length}</span>
              </button>
            ))}
          </div>

          <ul className="mt-6 grid gap-3">
            {shown.map((short) => {
              const state = shortState(short);
              const linked = comicTitle(short.linkedComicId);
              return (
                <li key={short.id}>
                  <Link
                    href={studioHref(`/creator/shorts/${short.id}`, mode)}
                    className="group flex items-center gap-4 border-2 border-line bg-panel p-3 transition-colors hover:border-mint"
                  >
                    <span className="relative shrink-0">
                      <StudioImage src={short.cover} width={160} className="aspect-[9/16] w-14 border-2 border-black sm:w-16" />
                      {short.durationSeconds != null && (
                        <span className="absolute bottom-1 left-1 bg-ink/85 px-1 text-[10px] font-semibold text-white">{formatDuration(short.durationSeconds)}</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {state === "published" && <span className="tag bg-mint">Published</span>}
                        {state === "draft" && <span className="tag border border-dashed border-slate-400 bg-transparent text-slate-300">Draft</span>}
                        {state === "scheduled" && short.publishAt && <span className="tag bg-sun">Goes live {when(short.publishAt)}</span>}
                        {short.genres.map((g) => (
                          <span key={g} className="text-xs text-slate-500">#{g.replace(/[^A-Za-z0-9]+/g, "")}</span>
                        ))}
                      </div>
                      <p className="mt-1 truncate font-semibold text-white group-hover:text-mint">{short.title || "Untitled"}</p>
                      <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                        {linked && (
                          <span className="flex items-center gap-1 text-mint">
                            <IoBookOutline /> {linked}
                          </span>
                        )}
                        <span>updated {timeAgo(short.updatedAt)}</span>
                      </p>
                    </div>
                    <div className="hidden shrink-0 gap-6 text-right sm:flex">
                      <div>
                        <p className="font-display text-2xl leading-none text-white">{formatCount(short.views)}</p>
                        <p className="text-xs text-slate-500">views</p>
                      </div>
                      <div>
                        <p className="font-display text-2xl leading-none text-white">{formatCount(short.likes)}</p>
                        <p className="text-xs text-slate-500">likes</p>
                      </div>
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
