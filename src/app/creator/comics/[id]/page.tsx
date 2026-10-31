import type { Metadata } from "next";
import { ComicEditor } from "@/components/studio/comics/ComicEditor";
import { StudioGate } from "@/components/studio/StudioGate";
import { StudioShell } from "@/components/studio/StudioShell";
import { studioHref } from "@/lib/studioModel";
import { getStudioContext } from "@/lib/studioServer";

export const metadata: Metadata = { title: "Edit Mafiki · Creator Studio | Toon Central", robots: { index: false } };

export default async function EditComicPage({ params, searchParams }: PageProps<"/creator/comics/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { mode, seeds, genres } = await getStudioContext(query);
  return (
    <StudioShell active="comics" query={studioHref("", mode)}>
      <StudioGate mode={mode} next={studioHref(`/creator/comics/${id}`, mode)}>
        <ComicEditor id={id} mode={mode} seeds={seeds} genres={genres} />
      </StudioGate>
    </StudioShell>
  );
}
