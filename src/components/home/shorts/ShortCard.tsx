"use client";

import { useRef, useState } from "react";
import { FaRegEye } from "react-icons/fa6";
import { IoHeartOutline } from "react-icons/io5";
import { MdPlayArrow } from "react-icons/md";
import type { Short } from "@/lib/api/types";
import { cloudinary, cloudinaryVideo, formatCount, formatDuration } from "@/lib/format";
import { genreTag } from "@/lib/tagStyles";

const PREVIEW_DELAY_MS = 300;
// Hover previews loop a short silent excerpt: skip the opening title card, then play this many seconds.
const PREVIEW_CLIP = { start: 2, length: 8 };

type ShortCardProps = {
  short: Short;
  duration?: number;
  onOpen: () => void;
};

// Cover card; resting a mouse on it plays a muted preview. The video only downloads on hover.
export function ShortCard({ short, duration, onOpen }: ShortCardProps) {
  const [previewing, setPreviewing] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPreview = () => {
    if (timer.current) clearTimeout(timer.current);
    setPreviewing(false);
    setPreviewReady(false);
  };

  return (
    <article className="group w-[44vw] shrink-0 transition-transform duration-200 hover:-translate-y-1 vsm:w-56 sm:w-60">
      <button
        type="button"
        onClick={onOpen}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") timer.current = setTimeout(() => setPreviewing(true), PREVIEW_DELAY_MS);
        }}
        onPointerLeave={stopPreview}
        aria-label={`Play ${short.title}${short.isSponsored ? " (sponsored)" : ""}`}
        className="block w-full text-left"
      >
        <div
          className={`relative aspect-[4/5] overflow-hidden border-2 bg-panel transition-shadow duration-200 ${
            short.isSponsored
              ? "border-dashed border-sun"
              : "border-line group-hover:border-mint group-hover:shadow-[6px_6px_0_var(--color-mint-deep)]"
          }`}
        >
          <img src={cloudinary(short.coverImage, 480)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />

          {previewing && (
            <video
              src={cloudinaryVideo(short.video, 480, PREVIEW_CLIP)}
              muted
              autoPlay
              loop
              playsInline
              onPlaying={() => setPreviewReady(true)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                previewReady ? "opacity-100" : "opacity-0"
              }`}
            />
          )}

          {short.isSponsored && <span className="tag absolute left-2 top-2 bg-paper">Sponsored</span>}
          {duration ? (
            <span className="absolute bottom-2 left-2 bg-ink/85 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {formatDuration(duration)}
            </span>
          ) : null}
          <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center border-2 border-black bg-mint text-2xl text-ink">
            <MdPlayArrow />
          </span>
        </div>

        <div className="px-0.5 pt-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-mint">{short.title}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-400">{short.isSponsored ? "Sponsored" : short.creator.username}</p>
          {!short.isSponsored && short.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {short.genres.slice(0, 2).map((genre) => (
                <span key={genre} className={`tag ${genreTag(genre)}`}>{genre}</span>
              ))}
            </div>
          )}
          <div className="mt-2 flex gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1"><FaRegEye /> {formatCount(short.views)}</span>
            <span className="flex items-center gap-1"><IoHeartOutline /> {formatCount(short.likes)}</span>
          </div>
        </div>
      </button>
    </article>
  );
}
