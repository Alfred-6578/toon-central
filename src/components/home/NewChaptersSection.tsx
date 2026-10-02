import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Comic } from "@/lib/api/types";
import type { DesignChoice } from "@/lib/designOptions";
import { cloudinary, comicHref, timeAgo } from "@/lib/format";
import { ReleaseLog } from "./latest/ReleaseLog";
import type { LogEntry } from "./latest/releaseLogData";

type NewChaptersSectionProps = {
  comics: Comic[];
  log: LogEntry[];
  variant?: DesignChoice<"latest">;
};

export function NewChaptersSection({ comics, log, variant = "log" }: NewChaptersSectionProps) {
  return (
    <section id="latest" className="mt-14">
      <RevealOnScroll className="block">
        <SectionHeader title="Latest Updates">
          {variant === "log" && <span className="pb-0.5 text-sm text-slate-400">New episodes and shorts, newest first</span>}
        </SectionHeader>

        {variant === "log" ? (
          <ReleaseLog entries={log} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {comics.map((item) => (
              <a key={item.uuid} href={comicHref(item.uuid)} className="group flex items-center gap-3">
                <div className="relative h-28 w-40 shrink-0 overflow-hidden border-2 border-line group-hover:border-mint">
                  <img
                    src={cloudinary(item.coverImage, 400)}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center p-2">
                  {item.hasNewEpisode && <span className="tag mb-1.5 bg-mint">New episode</span>}
                  <h3 className="truncate text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 truncate text-xs text-slate-300">by {item.creator.username}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Updated {timeAgo(item.lastEpisodeAt)}</p>
                </div>
                <span className="btn btn-primary mr-3 h-8 w-8 p-0 text-lg" aria-hidden="true">›</span>
              </a>
            ))}
          </div>
        )}
      </RevealOnScroll>
    </section>
  );
}
