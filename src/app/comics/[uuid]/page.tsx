import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComicHeader } from "@/components/comic/ComicHeader";
import { EpisodeList } from "@/components/comic/EpisodeList";
import { ShortsRail } from "@/components/home/shorts/ShortsRail";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { ComicGrid } from "@/components/ui/ComicGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getComicPageData, getSiteStats } from "@/lib/api/client";
import { cloudinary, creatorHref } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/comics/[uuid]">): Promise<Metadata> {
  const { uuid } = await params;
  const data = await getComicPageData(uuid);
  if (!data) return { title: "Comic not found | Toon Central" };
  const { comic } = data;
  return {
    title: `${comic.title} · ${comic.genres[0] ? `${comic.genres[0]} ` : ""}Mafiki by ${comic.creator.username} | Toon Central`,
    description: comic.description.slice(0, 160),
    openGraph: { title: comic.title, description: comic.description.slice(0, 160), images: [cloudinary(comic.coverImage, 800)] },
  };
}

export default async function ComicPage({ params }: PageProps<"/comics/[uuid]">) {
  const { uuid } = await params;
  const [data, stats] = await Promise.all([getComicPageData(uuid), getSiteStats()]);
  if (!data) notFound();

  const { comic, episodes, episodesSource, moreFromCreator, similar, shorts } = data;

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        {/* Clears the fixed header */}
        <div className="h-[66px]" />

        <ComicHeader comic={comic} />

        <div className="mx-auto px-6 md:px-8 lg:px-10">
          <EpisodeList comic={comic} episodes={episodes} episodesSource={episodesSource} />

          {shorts.length > 0 && (
            <section className="mt-14">
              <SectionHeader title="Watch the short" action={null}>
                <span className="pb-0.5 text-sm text-slate-400">Animated from this series</span>
              </SectionHeader>
              <ShortsRail shorts={shorts.map((s) => ({ ...s, linkedComic: null }))} />
            </section>
          )}

          {moreFromCreator.length > 0 && (
            <section className="mt-14">
              <SectionHeader title={`More from ${comic.creator.username}`} action="View profile" href={creatorHref(comic.creator.username)} />
              <ComicGrid comics={moreFromCreator} limit={5} />
            </section>
          )}

          {similar.length > 0 && (
            <section className="mb-16 mt-14">
              <SectionHeader title="You might also like" action={null}>
                <span className="pb-0.5 text-sm text-slate-400">Shares genres with {comic.title}</span>
              </SectionHeader>
              <ComicGrid comics={similar} limit={5} />
            </section>
          )}
        </div>

        <Footer stats={stats} />
      </main>
    </div>
  );
}
