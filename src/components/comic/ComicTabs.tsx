import { TabLinks } from "@/components/ui/TabLinks";
import { comicHref } from "@/lib/format";

export type ComicTab = "episodes" | "shorts";

// Episodes | Shorts switch for comics that also have animated shorts (links, so episode pagination keeps working).
export function ComicTabs({ uuid, tab, episodes, shorts }: { uuid: string; tab: ComicTab; episodes: number; shorts: number }) {
  return (
    <TabLinks
      label="Mafiki sections"
      current={tab}
      items={[
        { value: "episodes", label: "Episodes", count: episodes, href: `${comicHref(uuid)}#episodes` },
        { value: "shorts", label: "Shorts", count: shorts, href: `${comicHref(uuid)}?tab=shorts#episodes` },
      ]}
    />
  );
}
