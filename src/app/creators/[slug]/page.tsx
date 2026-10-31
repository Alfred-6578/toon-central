import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { ReleaseLog } from "@/components/home/latest/ReleaseLog";
import { buildReleaseLog } from "@/components/home/latest/releaseLogData";
import { PublishCard } from "@/components/home/indies/CreatorShelves";
import { ShortsRail } from "@/components/home/shorts/ShortsRail";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { ComicGrid } from "@/components/ui/ComicGrid";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TabLinks } from "@/components/ui/TabLinks";
import { getCreatorPageData, getSiteStats } from "@/lib/api/client";
import { cloudinary, comicCount, creatorHref, creatorSlug } from "@/lib/format";

type Params = PageProps<"/creators/[slug]">;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCreatorPageData(creatorSlug(decodeURIComponent(slug)));
  if (!data) return { title: "Creator not found | Toon Central" };
  const { creator, stats } = data;
  const work = [stats.comics && comicCount(stats.comics), data.shorts.length && `${data.shorts.length} shorts`].filter(Boolean).join(" and ");
  return {
    title: `${creator.username} | Toon Central`,
    description: `${creator.username} on Toon Central: ${work}.`,
    openGraph: { title: creator.username, images: data.comics[0] ? [cloudinary(data.comics[0].coverImage, 800)] : undefined },
  };
}

export default async function CreatorPage({ params, searchParams }: Params) {
  const [{ slug: raw }, query] = await Promise.all([params, searchParams]);
  // "/creators/Sanmi%20crown" and other variants go to the clean URL.
  const slug = creatorSlug(decodeURIComponent(raw));
  if (slug !== raw) permanentRedirect(`/creators/${slug}`);

  const [data, stats] = await Promise.all([getCreatorPageData(slug), getSiteStats()]);
  if (!data) notFound();

  const { creator, comics, shorts } = data;
  const activity = buildReleaseLog(comics, shorts, 6);
  // Comics | Shorts tabs when they make both; otherwise just the one they make.
  const tab = shorts.length > 0 && (query.tab === "shorts" || comics.length === 0) ? "shorts" : "comics";
  const href = creatorHref(creator.username);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />

        <CreatorHeader data={data} />

        <div className="mx-auto px-6 pb-16 md:px-8 lg:px-10">
          {(comics.length > 0 || shorts.length > 0) && (
            <section id="work" className="mt-12 scroll-mt-24">
              {comics.length > 0 && shorts.length > 0 ? (
                <TabLinks
                  label={`${creator.username}'s work`}
                  current={tab}
                  items={[
                    { value: "comics", label: "Mafiki", count: comics.length, href: `${href}#work` },
                    { value: "shorts", label: "Shorts", count: shorts.length, href: `${href}?tab=shorts#work` },
                  ]}
                />
              ) : (
                <SectionHeader title={tab === "shorts" ? "Shorts" : "Mafiki"} action={null} />
              )}
              {tab === "comics" ? (
                <>
                  <p className="-mt-1 mb-4 text-sm text-slate-400">Most read first</p>
                  <ComicGrid comics={comics} limit={comics.length} mobile="grid" />
                </>
              ) : (
                <>
                  <p className="-mt-1 mb-4 text-sm text-slate-400">Animated by {creator.username}</p>
                  <ShortsRail shorts={shorts} />
                </>
              )}
            </section>
          )}

          {activity.length > 1 && (
            <section className="mt-14">
              <SectionHeader title="Latest activity" action={null} />
              <ReleaseLog entries={activity} />
            </section>
          )}

          {/* Publishing is desktop-only, so the pitch is too */}
          <div className="mt-14 hidden lg:block">
            <PublishCard className="" />
          </div>
        </div>

        <Footer stats={stats} />
      </main>
    </div>
  );
}
