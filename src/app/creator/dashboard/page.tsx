import type { Metadata } from "next";
import { StudioOverviewGate } from "@/components/studio/StudioOverview";
import { StudioShell } from "@/components/studio/StudioShell";
import { DesignOptions } from "@/components/ui/DesignOptions";
import { getCreatorPageData } from "@/lib/api/client";
import { getMyStudio, studioLive } from "@/lib/api/studio";
import type { Comic, Short } from "@/lib/api/types";
import { resolveDesign } from "@/lib/designOptions";
import { sampleDailyReads, type StudioDemo } from "@/lib/studio";
import type { StudioComic, StudioShort } from "@/lib/studioModel";

export const metadata: Metadata = { title: "Creator Studio | Toon Central", robots: { index: false } };

// The creator used for the "established" demo: real public comics and shorts.
const DEMO_CREATOR = "47studios";

// The creator's own items in the shapes the Overview's cards and table use.
const asComic = (c: StudioComic): Comic => ({
  id: c.apiId ?? 0,
  uuid: c.id,
  title: c.title,
  description: c.synopsis,
  coverImage: c.cover ?? "",
  backgroundImage: c.banner ?? c.cover ?? "",
  status: c.status === "completed" ? "COMPLETED" : "ONGOING",
  updateDays: c.schedule,
  views: c.reads,
  likes: c.likes,
  episodes: c.episodes.length,
  lastEpisodeAt: c.updatedAt,
  createdAt: null,
  isNew: false,
  hasNewEpisode: false,
  isOriginal: false,
  genres: c.genres,
  creator: { username: "", photo: null },
  socialHandle: null,
});
const asShort = (s: StudioShort): Short => ({
  id: s.apiId ?? 0,
  uuid: s.id,
  title: s.title,
  description: s.caption,
  video: s.video ?? "",
  coverImage: s.cover ?? "",
  createdAt: s.updatedAt,
  views: s.views,
  likes: s.likes,
  genres: s.genres,
  creator: { username: "", photo: null },
  comicId: null,
  linkedComic: null,
  isSponsored: false,
});

export default async function CreatorDashboardPage({ searchParams }: PageProps<"/creator/dashboard">) {
  const design = resolveDesign(await searchParams);
  let demo: StudioDemo | null = null;

  if (studioLive()) {
    const mine = await getMyStudio();
    const live = mine && { comics: mine.comics.map(asComic), shorts: mine.shorts.map(asShort) };
    return (
      <StudioShell active="overview">
        <StudioOverviewGate demo={null} live={live ?? { comics: [], shorts: [] }} unreadable={!mine} />
      </StudioShell>
    );
  }

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
