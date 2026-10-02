"use client";

import { useCallback, useState } from "react";
import { MdPlayArrow } from "react-icons/md";
import { ShortsFeed } from "@/components/home/shorts/ShortsFeed";
import type { Short } from "@/lib/api/types";
import { cloudinary, comicHref } from "@/lib/format";
import { dateParts, type LogEntry } from "./releaseLogData";

function groupByMonth(entries: LogEntry[]) {
  const groups: { key: string; month: string; year: number; entries: LogEntry[] }[] = [];
  for (const entry of entries) {
    const { year, month } = dateParts(entry.date);
    const key = `${year}-${month}`;
    const last = groups.at(-1);
    if (last?.key === key) last.entries.push(entry);
    else groups.push({ key, month, year, entries: [entry] });
  }
  return groups;
}

function Thumb({ src, play = false }: { src: string; play?: boolean }) {
  return (
    <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden border-2 border-line bg-ink group-hover:border-mint">
      <img src={cloudinary(src, 160)} alt="" loading="lazy" className="h-full w-full object-cover" />
      {play && (
        <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center border border-black bg-mint text-sm text-ink">
          <MdPlayArrow />
        </span>
      )}
    </div>
  );
}

function EntryRow({ entry, onPlay }: { entry: LogEntry; onPlay: (short: Short) => void }) {
  const { day, month } = dateParts(entry.date);
  const isShort = entry.kind === "short";
  const title = isShort ? entry.short.title : entry.comic.title;
  const creator = isShort ? entry.short.creator.username : entry.comic.creator.username;
  const chapters = !isShort && entry.comic.episodes != null ? ` · ${entry.comic.episodes} ch` : "";

  const body = (
    <>
      <Thumb src={isShort ? entry.short.coverImage : entry.comic.coverImage} play={isShort} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`tag ${isShort ? "bg-mint" : "bg-sun"}`}>{isShort ? "Short" : "New episode"}</span>
          <span className="text-xs font-semibold text-slate-400">{day} {month}</span>
        </div>
        <p className="mt-1.5 truncate font-semibold text-white group-hover:text-mint">{title}</p>
        <p className="truncate text-xs text-slate-400">{creator}{chapters}</p>
      </div>
    </>
  );

  const className = "group flex w-full items-center gap-3 border-2 border-transparent p-2 text-left hover:border-line hover:bg-panel";
  return isShort ? (
    <button type="button" onClick={() => onPlay(entry.short)} className={className}>{body}</button>
  ) : (
    <a href={comicHref(entry.comic.uuid)} className={className}>{body}</a>
  );
}

export function ReleaseLog({ entries }: { entries: LogEntry[] }) {
  const shorts = entries.flatMap((e) => (e.kind === "short" ? [e.short] : []));
  const [playing, setPlaying] = useState<number | null>(null);
  const close = useCallback(() => setPlaying(null), []);

  return (
    <>
      <ol>
        {groupByMonth(entries).map((group, i, all) => (
          <li key={group.key} className="grid gap-x-8 md:grid-cols-[9rem_minmax(0,1fr)]">
            {/* Month stamp on the timeline rail */}
            <div className="relative pb-2 md:pb-8">
              <div className="flex items-baseline gap-2 md:block md:text-right">
                <p className="font-display text-4xl uppercase leading-none text-white">{group.month}</p>
                <p className="font-display text-lg leading-none text-slate-500 md:mt-1">{group.year}</p>
              </div>
              <span className="absolute -right-10 top-2 hidden h-3.5 w-3.5 border-2 border-black bg-mint md:block" />
            </div>

            <div className={`grid gap-1 pb-8 md:grid-cols-2 md:border-l-2 md:pl-6 ${i === all.length - 1 ? "md:border-transparent" : "md:border-line"}`}>
              {group.entries.map((entry) => (
                <EntryRow
                  key={`${entry.kind}-${entry.kind === "short" ? entry.short.uuid : entry.comic.uuid}`}
                  entry={entry}
                  onPlay={(short) => setPlaying(shorts.indexOf(short))}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>

      {playing !== null && (
        <ShortsFeed shorts={shorts} startIndex={playing} onClose={close} />
      )}
    </>
  );
}
