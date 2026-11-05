import type { Metadata } from "next";
import { NewComic } from "@/components/studio/comics/NewComic";
import { StudioGate } from "@/components/studio/StudioGate";
import { StudioShell } from "@/components/studio/StudioShell";
import { studioHref } from "@/lib/studioModel";
import { getStudioContext } from "@/lib/studioServer";

export const metadata: Metadata = { title: "New Mafiki · Creator Studio | Toon Central", robots: { index: false } };

export default async function NewComicPage({ searchParams }: PageProps<"/creator/comics/new">) {
  const { mode, seeds, genres, shortSeeds, unreadable } = await getStudioContext(await searchParams);
  return (
    <StudioShell active="comics" query={studioHref("", mode)}>
      <StudioGate mode={mode} next={studioHref("/creator/comics/new", mode)} hasItems={seeds.length + shortSeeds.length > 0} unreadable={unreadable}>
        <NewComic mode={mode} seeds={seeds} genres={genres} />
      </StudioGate>
    </StudioShell>
  );
}
