import type { Metadata } from "next";
import { StudioOverviewGate } from "@/components/studio/StudioOverview";
import { StudioShell } from "@/components/studio/StudioShell";
import { DesignOptions } from "@/components/ui/DesignOptions";
import { getCreatorPageData } from "@/lib/api/client";
import { resolveDesign } from "@/lib/designOptions";
import { sampleDailyReads, type StudioDemo } from "@/lib/studio";

export const metadata: Metadata = { title: "Creator Studio | Toon Central", robots: { index: false } };

// The creator used for the "established" demo: real public comics and shorts.
const DEMO_CREATOR = "47studios";

export default async function CreatorDashboardPage({ searchParams }: PageProps<"/creator/dashboard">) {
  const design = resolveDesign(await searchParams);
  let demo: StudioDemo | null = null;

  if (design.studio === "established") {
    const data = await getCreatorPageData(DEMO_CREATOR);
    if (data) {
      demo = {
        name: data.creator.username,
        handle: data.creator.username,
        comics: data.comics,
        shorts: data.shorts,
        sample: { followers: 1240, earningsNaira: 48300, dailyReads: sampleDailyReads(data.stats.reads) },
      };
    }
  }

  return (
    <>
      <StudioShell active="overview" query={design.studio === "established" ? "?studio=established" : ""}>
        <StudioOverviewGate demo={demo} />
      </StudioShell>
      <DesignOptions selection={design} basePath="/creator/dashboard" only={["studio"]} />
    </>
  );
}
