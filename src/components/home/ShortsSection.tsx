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
          ? // Full-bleed black band with sprocket holes top and bottom, like a strip of animation film.
            "filmstrip mt-16 -mx-6 px-6 py-14 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10"
          : "mt-14"
      }
    >
      <RevealOnScroll className="block">
        <SectionHeader title="Shorts" action="Watch all">
          <span className="pb-0.5 text-sm text-slate-400">Animated stories from African creators</span>
        </SectionHeader>
        <ShortsRail shorts={shorts} />
      </RevealOnScroll>
    </section>
  );
}
