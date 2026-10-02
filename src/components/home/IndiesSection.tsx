import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ComicGrid } from "@/components/ui/ComicGrid";
import type { Comic } from "@/lib/api/types";
import type { DesignChoice } from "@/lib/designOptions";
import { CreatorShelves } from "./indies/CreatorShelves";

type IndiesSectionProps = {
  comics: Comic[];
  topTenIds: Set<string>;
  variant?: DesignChoice<"indies">;
};

export function IndiesSection({ comics, topTenIds, variant = "creators" }: IndiesSectionProps) {
  const creatorCount = new Set(comics.map((c) => c.creator.username)).size;
  // Same rule as Originals: series the reader hasn't just seen in the Top 10 go first.
  const ordered = [...comics.filter((c) => !topTenIds.has(c.uuid)), ...comics.filter((c) => topTenIds.has(c.uuid))];

  return (
    <section id="indies" className="mt-14">
      <RevealOnScroll className="block">
        <SectionHeader title="Popular by Indies" action="Browse creators">
          <span className="pb-0.5 text-sm text-slate-400">{creatorCount} independent creators</span>
        </SectionHeader>
        {variant === "creators" ? <CreatorShelves comics={ordered} topTenIds={topTenIds} /> : <ComicGrid comics={ordered} />}
      </RevealOnScroll>
    </section>
  );
}
