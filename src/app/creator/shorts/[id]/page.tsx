import type { Metadata } from "next";
import { ShortEditor } from "@/components/studio/shorts/ShortEditor";
import { StudioGate } from "@/components/studio/StudioGate";
import { StudioShell } from "@/components/studio/StudioShell";
import { studioHref } from "@/lib/studioModel";
import { getStudioContext } from "@/lib/studioServer";

export const metadata: Metadata = { title: "Short · Creator Studio | Toon Central", robots: { index: false } };

// /creator/shorts/new uploads one; any other id edits that short.
export default async function StudioShortPage({ params, searchParams }: PageProps<"/creator/shorts/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { mode, seeds, shortSeeds, genres, demoData } = await getStudioContext(query);
  return (
    <StudioShell active="shorts" query={studioHref("", mode)}>
      <StudioGate mode={mode} next={studioHref(`/creator/shorts/${id}`, mode)}>
        <ShortEditor
          shortId={id === "new" ? null : id}
          mode={mode}
          seeds={shortSeeds}
          comicSeeds={seeds}
          genres={genres}
          demoHandle={demoData?.creator.username ?? null}
        />
      </StudioGate>
    </StudioShell>
  );
}
