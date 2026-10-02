import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ComicGrid } from "@/components/ui/ComicGrid";
import type { Comic } from "@/lib/api/types";
import type { DesignChoice } from "@/lib/designOptions";
import { OriginalSpotlight } from "./originals/OriginalSpotlight";

type OriginalsSectionProps = {
  comics: Comic[];
  spotlight: Comic | undefined;
  variant?: DesignChoice<"originals">;
};

export function OriginalsSection({ comics, spotlight, variant = "spread" }: OriginalsSectionProps) {
  const spread = variant === "spread" && spotlight;
  const shelf = spread ? comics.filter((c) => c.uuid !== spotlight.uuid) : comics;

  return (
    // Full-bleed cream band: cancels the page gutter, then re-applies it inside.
    <section id="originals" className="paper-band relative mt-16 -mx-6 px-6 py-12 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
      <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-64" />
      <RevealOnScroll className="relative block">
        <SectionHeader title="Toon Central Originals" action="Explore originals" tone="paper">
          <span className="pb-0.5 text-sm text-ink/60">{comics.length} series made with African creators</span>
        </SectionHeader>
        {spread && <OriginalSpotlight comic={spotlight} />}
        <ComicGrid comics={shelf} tone="paper" showOriginalBadge={false} />
      </RevealOnScroll>
    </section>
  );
}
