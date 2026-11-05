import { FilmEdge } from "@/components/ui/FilmEdge";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Short } from "@/lib/api/types";
import type { DesignChoice } from "@/lib/designOptions";
import { ShortsRail } from "./shorts/ShortsRail";

export function ShortsSection({ shorts, variant = "strip" }: { shorts: Short[]; variant?: DesignChoice<"shorts"> }) {
  const strip = variant === "strip";

  return (
    <section
      id="shorts"
      className={
        strip
          ? // Full-bleed band of film stock: perforated edge rails top and bottom, frame numbers on the edge.
            "filmstrip mt-16 -mx-6 px-6 py-16 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10"
          : "mt-14"
      }
    >
      {strip && <FilmEdge />}
      <RevealOnScroll className="block">
        <SectionHeader title="Shorts" action="Watch all" href="/shorts">
          <span className="pb-0.5 text-sm text-slate-400">Animated stories from African creators</span>
        </SectionHeader>
        <ShortsRail shorts={shorts} openOnShortsPage />
      </RevealOnScroll>
    </section>
  );
}
