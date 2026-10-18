import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReaderDock } from "@/components/reader/ReaderDock";
import { ReaderProgress } from "@/components/reader/ReaderProgress";
import { MtnPayFlow } from "@/components/mtn/MtnPayFlow";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { PassBanner } from "@/components/mtn/PassBanner";
import { LockedPage } from "@/components/reader/LockedPage";
import { ReaderGate } from "@/components/reader/ReaderGate";
import { UnlockDialog } from "@/components/reader/UnlockDialog";
import { ReaderTopBar, episodeHref } from "@/components/reader/ReaderTopBar";
import { ReaderTour } from "@/components/reader/ReaderTour";
import { getComicPageData } from "@/lib/api/client";
import { comicHref } from "@/lib/format";
import { buildEpisode } from "@/lib/reader";
import { parsePass, parseUnlocks, PASS_COOKIE, UNLOCKS_COOKIE } from "@/lib/session";

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

// What this request's reader has unlocked, and the time to judge 24-hour unlocks against.
async function readAccess() {
  const jar = await cookies();
  return [parseUnlocks(jar.get(UNLOCKS_COOKIE)?.value), Date.now(), parsePass(jar.get(PASS_COOKIE)?.value)?.until ?? null] as const;
}

export default async function ReaderPage({ params }: Params) {
  const data = await load(params);
  if (!data) notFound();

  const { comic, episode, total, episodesSource } = data;
  // The server decides which pages go out clean: unlocked ones (mock record in a cookie, see
  // session.ts) and the free preview. Everything else is only ever sent blurred.
  const { pages, lockedCount, premiumEpisode, passActive } = buildEpisode(comic, episode, ...(await readAccess()));
  const hasNext = total != null && episode < total;

  return (
    <div className="min-h-screen bg-ink text-white">
      <ReaderTopBar comic={comic} episode={episode} total={total} />

      <main className="mx-auto max-w-[720px] pb-24">
        <p className="mx-4 mt-4 border-2 border-dashed border-line px-4 py-3 text-xs leading-5 text-slate-400 sm:mx-0">
          Preview build: these pages are stand-ins cropped from the comic&apos;s cover and banner art.
          {episodesSource !== "live" && " Real pages arrive with the live API."}
        </p>

        {premiumEpisode && passActive && (
          <div className="mx-4 mt-4 sm:mx-0">
            <PassBanner />
          </div>
        )}

        <div className="mt-4">
          {pages.map((page) =>
            page.degraded ? (
              <LockedPage key={page.number} number={page.number} src={page.src} width={page.width} height={page.height} />
            ) : (
              <div key={page.number} className="relative">
                <img
                  id={`page-${page.number}`}
                  data-page={page.number}
                  src={page.src}
                  alt={`${comic.title}, episode ${episode}, page ${page.number}`}
                  width={page.width}
                  height={page.height}
                  loading={page.number <= 2 ? "eager" : "lazy"}
                  decoding="async"
                  className="block h-auto w-full scroll-mt-16"
                />
                {page.unlockedUntil && (
                  <span className="tag absolute right-2 top-2 bg-mint">Unlocked · 24h</span>
                )}
              </div>
            )
          )}
        </div>

        {lockedCount > 0 ? (
          <ReaderGate episode={episode} lockedCount={lockedCount} firstEpisodeHref={episodeHref(comic.uuid, 1)} />
        ) : (
          <div className="mx-4 mt-10 border-2 border-line bg-panel p-6 text-center sm:mx-0">
            <p className="font-display text-3xl uppercase leading-none text-white">End of episode {episode}</p>
            <p className="mt-2 text-sm text-slate-400">
              {hasNext ? "The story continues." : total == null ? "More episodes arrive with the live API." : "You're all caught up on this comic."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {hasNext && (
                <Link href={episodeHref(comic.uuid, episode + 1)} className="btn btn-primary px-6 py-3 text-base">
                  Next: episode {episode + 1}
                </Link>
              )}
              <Link href={comicHref(comic.uuid)} className="btn btn-ghost px-6 py-3 text-base">Back to comic</Link>
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
      <UnlockDialog uuid={comic.uuid} episode={episode} lockedCount={lockedCount} />
      <MtnPayFlow />
      <NotificationToast />
      <ReaderDock />
      <ReaderTour />
    </div>
  );
}
