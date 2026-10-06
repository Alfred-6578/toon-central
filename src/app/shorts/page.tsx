import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/layout/Navigation";
import { ShortsPageFeed } from "@/components/shorts/ShortsPageFeed";
import { getCatalogue, getShortsPageData } from "@/lib/api/client";
import { DesignOptions } from "@/components/ui/DesignOptions";
import { resolveDesign } from "@/lib/designOptions";
import { applyDemoTieIns } from "@/lib/demoTieIns";
import { cloudinary, genreSlug } from "@/lib/format";
import { buildShortsFeed } from "@/lib/shortsFeed";

// /shorts is the full-screen feed itself (the old browse page lives in src/app/_archive/shorts-browser).
type Params = PageProps<"/shorts">;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// A shared /shorts?short=… link previews as that short (title and cover) in chats and social posts.
export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const shortId = one((await searchParams).short);
  const short = shortId ? (await getShortsPageData(null, "popular")).shorts.find((s) => s.uuid === shortId) : undefined;
  if (!short) return { title: "Shorts | Toon Central", description: "Animated shorts from African creators on Toon Central." };
  const description = short.description || `Watch "${short.title}" by ${short.creator.username} on Toon Central.`;
  return {
    title: `${short.title} · Shorts | Toon Central`,
    description: description.slice(0, 160),
    openGraph: { title: short.title, description: description.slice(0, 160), images: [cloudinary(short.coverImage, 800)] },
  };
}

export default async function ShortsPage({ searchParams }: Params) {
  const query = await searchParams;
  const genre = one(query.genre) ?? null;
  const shortId = one(query.short);

  const design = resolveDesign(query);
  const [data, catalogue] = await Promise.all([getShortsPageData(null, "popular"), getCatalogue()]);
  const shorts = design.tieins === "demo" ? applyDemoTieIns(data.shorts, catalogue) : data.shorts;
  const feed = buildShortsFeed(shorts, genre);
  // Unknown or empty genre: fall back to the full feed rather than a blank screen.
  if (genre && !feed.length) redirect("/shorts");

  const startIndex = Math.max(0, shortId ? feed.findIndex((s) => s.uuid === shortId) : 0);

  return (
    <div className="h-dvh overflow-hidden bg-ink text-white">
      <Navigation />
      <h1 className="sr-only">Shorts</h1>
      {genre && (
        // A hashtag feed says what it's filtered to, with a way back to everything.
        <div className="fixed left-1/2 top-[4.75rem] z-40 flex -translate-x-1/2 items-center gap-2 border-2 border-black bg-mint px-3 py-1.5 text-sm font-bold text-ink shadow-[3px_3px_0_#000]">
          #{(feed[0]?.genres.find((g) => genreSlug(g) === genre) ?? genre).replace(/[^A-Za-z0-9]+/g, "")}
          <Link href="/shorts" className="ml-1 underline-offset-2 hover:underline">All shorts ✕</Link>
        </div>
      )}
      <ShortsPageFeed shorts={feed} startIndex={startIndex} />
      <DesignOptions selection={design} basePath="/shorts" only={["tieins"]} className="left-4 top-[8.5rem] lg:left-6" />
    </div>
  );
}
