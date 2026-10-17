import type { Metadata } from "next";
import { EarningsView } from "@/components/studio/earnings/EarningsView";
import { StudioGate } from "@/components/studio/StudioGate";
import { StudioShell } from "@/components/studio/StudioShell";
import { DesignOptions } from "@/components/ui/DesignOptions";
import { studioHref } from "@/lib/studioModel";
import { getStudioContext } from "@/lib/studioServer";

export const metadata: Metadata = { title: "Earnings · Creator Studio | Toon Central", robots: { index: false } };

export default async function StudioEarningsPage({ searchParams }: PageProps<"/creator/earnings">) {
  const { design, mode, seeds } = await getStudioContext(await searchParams);
  return (
    <>
      <StudioShell active="earnings" query={studioHref("", mode)}>
        <StudioGate mode={mode} next={studioHref("/creator/earnings", mode)}>
          <EarningsView mode={mode} comics={seeds} />
        </StudioGate>
      </StudioShell>
      <DesignOptions selection={design} basePath="/creator/earnings" only={["studio"]} />
    </>
  );
}
