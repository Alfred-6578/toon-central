import type { Comic } from "@/lib/api/types";
import { ComicCard, type CardTone } from "./ComicCard";

type ComicGridProps = {
  comics: Comic[];
  limit?: number;
  tone?: CardTone;
  showOriginalBadge?: boolean;
  // "rail" scrolls sideways on phones (homepage shelves); "grid" wraps into two columns (full listings).
  mobile?: "rail" | "grid";
};

// Comic-shop shelf: swipeable rail below sm, portrait grid from sm up.
export function ComicGrid({ comics, limit = 10, tone = "dark", showOriginalBadge = true, mobile = "rail" }: ComicGridProps) {
  const items = comics.slice(0, limit);

  if (mobile === "grid") {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 pt-1 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5">
        {items.map((comic) => (
          <ComicCard key={comic.uuid} comic={comic} tone={tone} showOriginalBadge={showOriginalBadge} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="sm:hidden -mx-6 overflow-x-auto px-6 pb-3 pt-1 hide-scrollbar">
        <div className="flex w-max gap-4">
          {items.map((comic) => (
            <ComicCard key={comic.uuid} comic={comic} tone={tone} showOriginalBadge={showOriginalBadge} className="w-[40vw] max-w-[180px] shrink-0" />
          ))}
        </div>
      </div>

      <div className="hidden gap-x-5 gap-y-8 pt-1 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((comic) => (
          <ComicCard key={comic.uuid} comic={comic} tone={tone} showOriginalBadge={showOriginalBadge} />
        ))}
      </div>
    </>
  );
}
