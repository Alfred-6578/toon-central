import type { CSSProperties } from "react";
import Link from "next/link";
import type { Comic } from "@/lib/api/types";
import type { Vibe } from "@/lib/discover";
import { cloudinary } from "@/lib/format";

const toneColor = { mint: "var(--color-mint)", sun: "var(--color-sun)", paper: "var(--color-paper)" };

const fanSlots = [
  "z-20 left-1/2 -translate-x-1/2 group-hover:-translate-y-2",
  "z-10 left-[8%] -rotate-[10deg] group-hover:-translate-x-2 group-hover:-rotate-[14deg]",
  "z-10 right-[8%] rotate-[10deg] group-hover:translate-x-2 group-hover:rotate-[14deg]",
];

type VibeTile = { vibe: Vibe; count: number; covers: Comic[] };

export const vibeHref = (id: string) => `/discover/${id}`;

// Mood collections: a fan of covers on a halftone field in the vibe's colour, then the pitch.
export function VibeTiles({ vibes }: { vibes: VibeTile[] }) {
  return (
    <div className="hide-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
      {vibes.map(({ vibe, count, covers }) => (
        <Link
          key={vibe.id}
          href={vibeHref(vibe.id)}
          style={{ "--dot-color": toneColor[vibe.tone] } as CSSProperties}
          className="group block w-[78vw] max-w-[340px] shrink-0 border-2 border-line bg-panel transition-transform duration-200 hover:-translate-y-1 hover:border-mint md:w-auto md:max-w-none"
        >
          <div className="relative h-56 overflow-hidden border-b-2 border-line bg-ink">
            <div className="dot-field absolute inset-0 opacity-60" />
            {covers.map((comic, i) => (
              <div
                key={comic.uuid}
                className={`absolute top-7 w-[32%] min-w-[88px] border-2 border-black bg-ink shadow-[5px_5px_0_#000] transition-transform duration-300 ${fanSlots[i]}`}
              >
                <img src={cloudinary(comic.coverImage, 280)} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
              </div>
            ))}
          </div>
          <div className="p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-2xl uppercase leading-none text-white group-hover:text-mint">{vibe.title}</p>
              <p className="shrink-0 text-xs font-semibold text-slate-400">{count} series</p>
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-400">{vibe.blurb}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
