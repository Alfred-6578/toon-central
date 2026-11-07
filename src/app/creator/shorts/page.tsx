import type { Metadata } from "next";
import { ShortsList } from "@/components/studio/shorts/ShortsList";
import { StudioGate } from "@/components/studio/StudioGate";
import { StudioShell } from "@/components/studio/StudioShell";
import { DesignOptions } from "@/components/ui/DesignOptions";
import { studioHref } from "@/lib/studioModel";
import { getStudioContext } from "@/lib/studioServer";

export const metadata: Metadata = { title: "Shorts · Creator Studio | Toon Central", robots: { index: false } };

export default async function StudioShortsPage({ searchParams }: PageProps<"/creator/shorts">) {
  const { design, mode, seeds, shortSeeds, unreadable } = await getStudioContext(await searchParams);
  return (
    <>
      <StudioShell active="shorts" query={studioHref("", mode)}>
        <StudioGate mode={mode} next={studioHref("/creator/shorts", mode)} hasItems={seeds.length + shortSeeds.length > 0} unreadable={unreadable}>
          <ShortsList mode={mode} seeds={shortSeeds} comicSeeds={seeds} />
        </StudioGate>
      </StudioShell>
      <DesignOptions selection={design} basePath="/creator/shorts" only={["studio"]} />
    </>
  );
}
