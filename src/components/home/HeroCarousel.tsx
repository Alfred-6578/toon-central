import type { Comic } from "@/lib/api/types";
import type { DesignChoice } from "@/lib/designOptions";
import { BleedHero } from "./hero/BleedHero";
import { PanelHero } from "./hero/PanelHero";

export function HeroCarousel({ slides, variant = "panel" }: { slides: Comic[]; variant?: DesignChoice<"hero"> }) {
  return variant === "bleed" ? <BleedHero slides={slides} /> : <PanelHero slides={slides} />;
}
