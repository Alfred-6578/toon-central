import type { Metadata } from "next";
import { NewComic } from "@/components/studio/comics/NewComic";
import { StudioGate } from "@/components/studio/StudioGate";
import { StudioShell } from "@/components/studio/StudioShell";
import { studioHref } from "@/lib/studioModel";
import { getStudioContext } from "@/lib/studioServer";

export const metadata: Metadata = { title: "New comic · Creator Studio | Toon Central", robots: { index: false } };

export default async function NewComicPage({ searchParams }: PageProps<"/creator/comics/new">) {
  const { mode, seeds, genres } = await getStudioContext(await searchParams);
  return (
    <StudioShell active="comics" query={studioHref("", mode)}>
      <StudioGate mode={mode} next={studioHref("/creator/comics/new", mode)}>
        <NewComic mode={mode} seeds={seeds} genres={genres} />
      </StudioGate>
    </StudioShell>
  );
}
