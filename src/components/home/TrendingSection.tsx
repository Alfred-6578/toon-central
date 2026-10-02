import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ComicGrid } from "@/components/ui/ComicGrid";
import type { Comic } from "@/lib/api/types";
import type { DesignChoice } from "@/lib/designOptions";
import { TrendingChart } from "./trending/TrendingChart";

export function TrendingSection({ comics, variant = "chart" }: { comics: Comic[]; variant?: DesignChoice<"trending"> }) {
  return (
    <section id="trending" className="mt-14">
      <RevealOnScroll className="block">
        <SectionHeader title="Trending">
          {variant === "chart" && <span className="pb-0.5 text-sm text-slate-400">Top 10 · ranked by total reads</span>}
        </SectionHeader>
        {variant === "chart" ? <TrendingChart comics={comics} /> : <ComicGrid comics={comics} />}
      </RevealOnScroll>
    </section>
  );
}
