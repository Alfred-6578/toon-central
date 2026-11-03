import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EpisodeEnd } from "@/components/reader/EpisodeEnd";
import { EpisodeLoader } from "@/components/reader/EpisodeLoader";
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
import { SignInGate } from "@/components/reader/SignInGate";
import { getComicPageData } from "@/lib/api/client";
import { isLive } from "@/lib/api/config";
import { getEpisodePages } from "@/lib/api/episodes";
import { getAccessToken } from "@/lib/api/token";
import { buildEpisode, signInPreviewPages } from "@/lib/reader";
import { parsePass, parseUnlocks, PASS_COOKIE, SESSION_COOKIE, UNLOCKS_COOKIE } from "@/lib/session";

type Params = PageProps<"/comics/[uuid]/read/[episode]">;

async function load(params: Params["params"]) {
  const { uuid, episode: raw } = await params;
  const episode = Number(raw);
  const data = await getComicPageData(uuid);
  if (!data || !Number.isInteger(episode) || episode < 1) return null;

  // Many comics have no episode count in the lists the server reads; the comic page's live list can
  // still link to any of their episodes, so only a known count rules an episode out.
  const total = data.episodes.length || null;
  if (total && episode > total) return null;
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

export default async function ReaderPage({ params, searchParams }: Params) {
  const [data, query] = await Promise.all([load(params), searchParams]);
  if (!data) notFound();

  const { comic, episode, total } = data;
  // Real pages need the episode's backend id, which links from the comic page's live list carry.
  const episodeId = Number(query.id);
  const hasId = Number.isInteger(episodeId) && episodeId > 0;
  // The backend only serves episode 1 to signed-out readers, so they get the sign-in gate without
  // asking it; signed-in readers whose token it turns down get the same.
  // Before accounts go live, the demo sign-in counts (its cookie): it opens the episode on stand-in
  // pages, since only a real sign-in brings real ones.
  const token = await getAccessToken();
  const signedIn = isLive("accounts") ? token !== null : (await cookies()).get(SESSION_COOKIE)?.value === "1";
  const signedOutGate = isLive("reading") && episode > 1 && !signedIn;
  const real = hasId && token && !signedOutGate ? await getEpisodePages(comic.uuid, episodeId, episode) : null;
  if (signedOutGate || real?.status === "signin") {
    return (
      <div className="h-dvh overflow-hidden bg-ink text-white">
        <ReaderTopBar comic={comic} episode={episode} total={total} />
        <main className="mx-auto max-w-[720px]">
          <SignInGate
            comic={comic}
            episode={episode}
            total={total}
            pages={signInPreviewPages(comic, episode, 2)}
            next={`${episodeHref(comic.uuid, episode)}${hasId ? `?id=${episodeId}` : ""}`}
            preview={!isLive("accounts")}
          />
        </main>
        <NotificationToast />
        <EpisodeLoader key={`${comic.uuid}-${episode}`} />
      </div>
    );
  }
  // The server decides which pages go out clean: unlocked ones (mock record in a cookie, see
  // session.ts) and the free preview. Everything else is only ever sent blurred.
  const { pages, lockedCount, premiumEpisode, passActive } = buildEpisode(
    comic,
    episode,
    ...(await readAccess()),
    real?.status === "ok" ? real.pages : null
  );

  return (
    <div className="min-h-screen bg-ink text-white">
      <ReaderTopBar comic={comic} episode={episode} total={total} />

      <main className="mx-auto max-w-[720px] pb-24">
        {real?.status !== "ok" && (
          <p className="mx-4 mt-4 border-2 border-dashed border-line px-4 py-3 text-xs leading-5 text-slate-400 sm:mx-0">
            Preview build: these pages are stand-ins cropped from the Mafiki&apos;s cover and banner art.{" "}
            {episode > 1 && !token
              ? "Real pages need a real sign-in, which isn't connected yet."
              : "Real pages load when you open the episode from the Mafiki's episode list."}
          </p>
        )}

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
          <EpisodeEnd uuid={comic.uuid} episode={episode} total={total} />
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
      <EpisodeLoader key={`${comic.uuid}-${episode}`} />
    </div>
  );
}
