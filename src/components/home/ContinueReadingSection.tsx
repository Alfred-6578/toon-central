"use client";

import Link from "next/link";
import { IoClose, IoPlay } from "react-icons/io5";
import { cloudinaryTransform } from "@/lib/format";
import { removeProgress, resumeTarget, useReadingProgress, type ReadingProgress } from "@/lib/readingProgress";

// The rail shows the most recent; the full list is the library's History tab.
const RAIL_LIMIT = 12;

// Only appears once someone has opened an episode in this browser; first-time visitors never see it.
export function ContinueReadingSection() {
  const progress = useReadingProgress().slice(0, RAIL_LIMIT);
  if (!progress.length) return null;

  return (
    <section id="continue-reading" aria-labelledby="continue-reading-title" className="mt-10">
      <div className="mb-5 flex items-end justify-between gap-4 border-b-2 border-line pb-3">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <h2 id="continue-reading-title" className="font-display text-3xl uppercase leading-none text-white sm:text-4xl">
            Continue reading
          </h2>
          <span className="hidden pb-0.5 text-sm text-slate-400 sm:inline">Right where you stopped</span>
        </div>
        <Link href="/library?tab=history" className="shrink-0 text-sm font-semibold text-slate-300 hover:text-mint">
          History →
        </Link>
      </div>

      <ul className="hide-scrollbar -mx-6 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-2 md:-mx-8 md:scroll-px-8 md:px-8 lg:-mx-10 lg:scroll-px-10 lg:px-10">
        {progress.map((p) => (
          <ResumeCard key={p.uuid} progress={p} />
        ))}
      </ul>
    </section>
  );
}

function ResumeCard({ progress: p }: { progress: ReadingProgress }) {
  const { episode, page } = resumeTarget(p);
  const href = `/comics/${p.uuid}/read/${episode}${page > 1 ? `#page-${page}` : ""}`;
  const percent = p.finished ? 0 : Math.round((p.page / p.pagesInEpisode) * 100);

  return (
    <li className="group relative w-[17rem] shrink-0 snap-start sm:w-[19rem]">
      <Link
        href={href}
        className="flex h-full border-2 border-black bg-panel shadow-[4px_4px_0_#000] transition-transform hover:-translate-x-px hover:-translate-y-px"
      >
        <img
          src={cloudinaryTransform(p.coverImage, "c_fill,w_180,h_240,g_north,q_auto,f_auto")}
          alt=""
          width={90}
          height={120}
          loading="lazy"
          className="h-[120px] w-[90px] shrink-0 border-r-2 border-black object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col p-3 pr-8">
          <p className="truncate font-display text-xl uppercase leading-tight text-white">{p.title}</p>
          <p className="mt-1 text-xs text-slate-400">
            {p.finished ? (
              <><span className="font-bold text-sun">Up next</span> · Episode {episode}</>
            ) : (
              <>Episode {p.episode} · Page {p.page} of {p.pagesInEpisode}</>
            )}
          </p>

          <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-bold text-mint group-hover:underline group-hover:underline-offset-4">
            <IoPlay className="text-xs" />
            {p.finished ? "Start episode" : "Resume"}
          </span>
          {/* Progress through the episode, as a strip of panels rather than a smooth bar. */}
          <div aria-hidden="true" className="mt-2 flex gap-0.5">
            {Array.from({ length: p.pagesInEpisode }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 ${!p.finished && i < p.page ? "bg-mint" : "bg-line"}`} />
            ))}
          </div>
          {!p.finished && <span className="sr-only">{percent}% through the episode</span>}
        </div>
      </Link>

      <button
        type="button"
        onClick={() => removeProgress(p.uuid)}
        aria-label={`Remove ${p.title} from continue reading`}
        title="Remove"
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center text-slate-500 hover:text-white"
      >
        <IoClose />
      </button>
    </li>
  );
}
