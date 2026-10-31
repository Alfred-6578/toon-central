import type { Metadata } from "next";
import { ComicsList } from "@/components/studio/comics/ComicsList";
import { StudioGate } from "@/components/studio/StudioGate";
import { StudioShell } from "@/components/studio/StudioShell";
import { DesignOptions } from "@/components/ui/DesignOptions";
import { studioHref } from "@/lib/studioModel";
import { getStudioContext } from "@/lib/studioServer";

export const metadata: Metadata = { title: "Mafiki · Creator Studio | Toon Central", robots: { index: false } };

export default async function StudioComicsPage({ searchParams }: PageProps<"/creator/comics">) {
  const { design, mode, seeds } = await getStudioContext(await searchParams);
  return (
    <>
      <StudioShell active="comics" query={studioHref("", mode)}>
        <StudioGate mode={mode} next={studioHref("/creator/comics", mode)}>
          <ComicsList mode={mode} seeds={seeds} />
        </StudioGate>
      </StudioShell>
      <DesignOptions selection={design} basePath="/creator/comics" only={["studio"]} />
    </>
  );
}
