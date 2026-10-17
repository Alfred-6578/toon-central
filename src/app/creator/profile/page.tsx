import type { Metadata } from "next";
import { ProfileEditor } from "@/components/studio/profile/ProfileEditor";
import { StudioGate } from "@/components/studio/StudioGate";
import { StudioShell } from "@/components/studio/StudioShell";
import { DesignOptions } from "@/components/ui/DesignOptions";
import type { CreatorProfile, SocialPlatform } from "@/lib/mockCreator";
import { studioHref } from "@/lib/studioModel";
import { getStudioContext } from "@/lib/studioServer";

export const metadata: Metadata = { title: "Profile · Creator Studio | Toon Central", robots: { index: false } };

const KNOWN: SocialPlatform[] = ["instagram", "x", "tiktok", "youtube", "facebook"];

export default async function StudioProfilePage({ searchParams }: PageProps<"/creator/profile">) {
  const { design, mode, genres, demoData } = await getStudioContext(await searchParams);

  // The established demo starts from the creator's real public profile.
  const seed: CreatorProfile | null = demoData
    ? {
        name: demoData.creator.username,
        handle: demoData.creator.username,
        makes: demoData.shorts.length ? ["comics", "shorts"] : ["comics"],
        bio: "",
        tagline: "",
        avatar: demoData.creator.photo,
        banner: demoData.comics[0]?.backgroundImage ?? null,
        genres: demoData.genres.slice(0, 3),
        socials: demoData.socials
          .filter((s) => s.platform && (KNOWN as string[]).includes(s.platform === "twitter" ? "x" : s.platform))
          .map((s) => ({ platform: (s.platform === "twitter" ? "x" : s.platform) as SocialPlatform, handle: s.handle })),
      }
    : null;

  return (
    <>
      <StudioShell active="profile" query={studioHref("", mode)}>
        <StudioGate mode={mode} next={studioHref("/creator/profile", mode)}>
          <ProfileEditor mode={mode} seed={seed} genres={genres} />
        </StudioGate>
      </StudioShell>
      <DesignOptions selection={design} basePath="/creator/profile" only={["studio"]} />
    </>
  );
}
