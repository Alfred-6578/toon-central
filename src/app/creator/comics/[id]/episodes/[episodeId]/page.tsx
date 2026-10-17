import type { Metadata } from "next";
import { EpisodeEditor } from "@/components/studio/comics/EpisodeEditor";
import { StudioGate } from "@/components/studio/StudioGate";
import { StudioShell } from "@/components/studio/StudioShell";
import { studioHref } from "@/lib/studioModel";
import { getStudioContext } from "@/lib/studioServer";

export const metadata: Metadata = { title: "Episode · Creator Studio | Toon Central", robots: { index: false } };

// /episodes/new adds one; any other id edits that episode.
export default async function EpisodePage({ params, searchParams }: PageProps<"/creator/comics/[id]/episodes/[episodeId]">) {
  const [{ id, episodeId }, query] = await Promise.all([params, searchParams]);
  const { mode, seeds } = await getStudioContext(query);
  return (
    <StudioShell active="comics" query={studioHref("", mode)}>
      <StudioGate mode={mode} next={studioHref(`/creator/comics/${id}/episodes/${episodeId}`, mode)}>
        <EpisodeEditor comicId={id} episodeId={episodeId === "new" ? null : episodeId} mode={mode} seeds={seeds} />
      </StudioGate>
    </StudioShell>
  );
}
