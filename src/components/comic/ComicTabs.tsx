import Link from "next/link";
import { comicHref } from "@/lib/format";

export type ComicTab = "episodes" | "shorts";

// Episodes | Shorts switch for comics that also have animated shorts. Plain links (?tab=shorts) so the
// page renders on the server, the view can be shared, and episode pagination keeps working.
export function ComicTabs({ uuid, tab, episodes, shorts }: { uuid: string; tab: ComicTab; episodes: number; shorts: number }) {
  const items: { value: ComicTab; label: string; count: number }[] = [
    { value: "episodes", label: "Episodes", count: episodes },
    { value: "shorts", label: "Shorts", count: shorts },
  ];

  return (
    <nav aria-label="Comic sections" className="mb-5 flex gap-2 border-b-2 border-line">
      {items.map(({ value, label, count }) => {
        const active = value === tab;
        return (
          <Link
            key={value}
            href={`${comicHref(uuid)}${value === "shorts" ? "?tab=shorts" : ""}#episodes`}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`-mb-0.5 flex items-center gap-2 border-2 px-4 py-2.5 font-display text-2xl uppercase leading-none sm:text-3xl ${
              active ? "border-line border-b-ink bg-ink text-white" : "border-transparent text-slate-500 hover:text-white"
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`min-w-6 px-1.5 py-0.5 text-center font-sans text-xs font-bold ${active ? "bg-mint text-ink" : "bg-panel text-slate-400"}`}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
