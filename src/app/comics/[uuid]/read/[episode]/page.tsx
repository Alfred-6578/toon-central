import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReaderDock } from "@/components/reader/ReaderDock";
import { ReaderProgress } from "@/components/reader/ReaderProgress";
import { ReaderGate } from "@/components/reader/ReaderGate";
import { ReaderTopBar, episodeHref } from "@/components/reader/ReaderTopBar";
import { ReaderTour } from "@/components/reader/ReaderTour";
import { getComicPageData } from "@/lib/api/client";
import { comicHref } from "@/lib/format";
import { buildEpisode } from "@/lib/reader";
import { SESSION_COOKIE } from "@/lib/session";

type Params = PageProps<"/comics/[uuid]/read/[episode]">;

async function load(params: Params["params"]) {
  const { uuid, episode: raw } = await params;
  const episode = Number(raw);
  const data = await getComicPageData(uuid);
  if (!data || !Number.isInteger(episode) || episode < 1) return null;

  // Without a known episode count only episode 1 is guaranteed to exist.
  const total = data.episodes.length || null;
  if (total ? episode > total : episode !== 1) return null;
  return { ...data, episode, total };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Episode not found | Toon Central" };
  return { title: `${data.comic.title} · Episode ${data.episode} | Toon Central` };
}

export default async function ReaderPage({ params }: Params) {
  const data = await load(params);
  if (!data) notFound();

  const { comic, episode, total, episodesSource } = data;
  // The server decides access. Demo: the mock sign-in cookie makes you Premium.
  const premiumReader = (await cookies()).get(SESSION_COOKIE)?.value === "1";
  const { pages, gated } = buildEpisode(comic, episode, premiumReader);
  const hasNext = total != null && episode < total;

  return (
    <div className="min-h-screen bg-ink text-white">
      <ReaderTopBar comic={comic} episode={episode} total={total} />

      <main className="mx-auto max-w-[720px] pb-24">
        <p className="mx-4 mt-4 border-2 border-dashed border-line px-4 py-3 text-xs leading-5 text-slate-400 sm:mx-0">
          Preview build: these pages are stand-ins cropped from the series&apos; cover and banner art.
          {episodesSource !== "live" && " Real pages arrive with the live API."}
        </p>

        <div className="mt-4">
          {pages.map((page) => (
            <img
              key={page.number}
              id={page.degraded ? undefined : `page-${page.number}`}
              data-page={page.degraded ? undefined : page.number}
              src={page.src}
              alt={page.degraded ? "" : `${comic.title}, episode ${episode}, page ${page.number}`}
              width={page.width}
              height={page.height}
              loading={page.number <= 2 ? "eager" : "lazy"}
              decoding="async"
              className="block h-auto w-full scroll-mt-16"
            />
          ))}
        </div>

        {gated ? (
          <ReaderGate episode={episode} firstEpisodeHref={episodeHref(comic.uuid, 1)} />
        ) : (
          <div className="mx-4 mt-10 border-2 border-line bg-panel p-6 text-center sm:mx-0">
            <p className="font-display text-3xl uppercase leading-none text-white">End of episode {episode}</p>
            <p className="mt-2 text-sm text-slate-400">
              {hasNext ? "The story continues." : total == null ? "More episodes arrive with the live API." : "You're all caught up on this series."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {hasNext && (
                <Link href={episodeHref(comic.uuid, episode + 1)} className="btn btn-primary px-6 py-3 text-base">
                  Next: episode {episode + 1}
                </Link>
              )}
              <Link href={comicHref(comic.uuid)} className="btn btn-ghost px-6 py-3 text-base">Back to series</Link>
            </div>
          </div>
        )}
      </main>

      <ReaderProgress
        uuid={comic.uuid}
        title={comic.title}
        coverImage={comic.coverImage}
        episode={episode}
        pagesInEpisode={pages.filter((p) => !p.degraded).length}
        totalEpisodes={total}
      />
      <ReaderDock />
      <ReaderTour />
    </div>
  );
}
