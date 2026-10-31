"use client";

import Link from "next/link";
import { IoSettingsOutline, IoWalletOutline } from "react-icons/io5";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { ContinueReadingSection } from "@/components/home/ContinueReadingSection";
import { Avatar } from "@/components/layout/nav/Menus";
import { ComicGrid } from "@/components/ui/ComicGrid";
import { CreatorAvatar } from "@/components/ui/CreatorAvatar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Comic } from "@/lib/api/types";
import { creatorHref } from "@/lib/format";
import type { FollowedCreator } from "@/lib/library";
import { useMockFollows, useMockLibrary, useMockSavedShorts, useMockSession, useHydrated } from "@/lib/mockSession";
import { useReadingProgress } from "@/lib/readingProgress";

const joinedLabel = (date: string) => new Date(date).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

// The reader's own page: who they are, their plan, and shortcuts into what they read and follow.
// Everything here is the reader's own activity in this browser; nothing is invented.
export function ProfileView({ comics, creators }: { comics: Comic[]; creators: FollowedCreator[] }) {
  const { user } = useMockSession();
  const library = useMockLibrary();
  const follows = useMockFollows();
  const savedShorts = useMockSavedShorts();
  const progress = useReadingProgress();

  const hydrated = useHydrated();
  if (!hydrated) return <div className="min-h-[50vh]" />;

  if (!user) {
    return (
      <>
        <SignInPrompt
          title="Your profile"
          body="Sign in to see your library, the creators you follow and your plan in one place."
          next="/me"
        />
        <ContinueReadingSection />
      </>
    );
  }

  const byUuid = new Map(comics.map((c) => [c.uuid, c]));
  const saved = [...library.ids].reverse().flatMap((id) => byUuid.get(id) ?? []);
  const followed = follows.ids.flatMap((name) => creators.find((c) => c.creator.username === name) ?? []);

  const stats = [
    { value: saved.length, label: "In library", href: "/library" },
    { value: progress.length, label: "Started", href: "/library?tab=history" },
    { value: savedShorts.ids.length, label: "Saved shorts", href: "/library?tab=shorts" },
  ];

  return (
    <>
      <section className="flex flex-col gap-6 border-b-2 border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-4 sm:items-center sm:gap-5">
            <Avatar user={user} className="h-16 w-16 text-2xl shadow-[3px_3px_0_#000] sm:h-28 sm:w-28 sm:text-4xl sm:shadow-[4px_4px_0_#000]" />
            <div className="min-w-0">
              <h1 className="line-clamp-2 break-words font-display text-3xl uppercase leading-[0.95] text-white sm:text-6xl sm:leading-[0.9]">{user.name}</h1>
              <p className="mt-1.5 text-xs text-slate-400 sm:mt-2 sm:text-sm">
                @{user.username} · Reading since {joinedLabel(user.joined)}
              </p>
              <p className="mt-1.5 flex flex-wrap gap-x-4 text-sm text-slate-400">
                <span>
                  <span className="font-bold text-white">{user.followers.toLocaleString()}</span> {user.followers === 1 ? "follower" : "followers"}
                </span>
                <Link href="/library?tab=following" className="hover:text-mint">
                  <span className="font-bold text-white">{followed.length}</span> following
                </Link>
                <Link href="/settings#referrals" className="hover:text-mint">
                  <span className="font-bold text-white">{user.referrals.length}</span> brought in
                </Link>
              </p>
            </div>
          </div>
          {/* Under the whole header row on phones (full width); lined up with the name from sm up. */}
          {user.bio ? (
            <p className="mt-4 max-w-xl break-words text-sm leading-6 text-slate-300 sm:mt-3 sm:pl-[8.25rem]">{user.bio}</p>
          ) : (
            <Link href="/settings#profile" className="mt-4 inline-block text-sm font-semibold text-slate-400 underline-offset-4 hover:text-mint hover:underline sm:mt-3 sm:ml-[8.25rem]">
              + Add a bio
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-stretch gap-3">
          <div className="border-2 border-line px-4 py-2.5">
            <span className={`tag ${user.plan.tier === "Premium" ? "bg-mint" : "bg-paper"}`}>{user.plan.tier}</span>
            <p className="mt-1.5 text-xs text-slate-400">{user.plan.renews ? `Renews ${user.plan.renews}` : "Free plan"}</p>
          </div>
          <div className="border-2 border-line px-4 py-2.5">
            <p className="flex items-center gap-1.5 font-semibold text-white">
              <IoWalletOutline className="text-mint" /> {user.credits.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">Credits</p>
          </div>
          <Link href="/settings" className="btn btn-ghost gap-2 px-5 text-sm">
            <IoSettingsOutline className="text-base" /> Edit profile
          </Link>
        </div>
      </section>

      <ul className="mt-6 grid grid-cols-3 gap-2.5 sm:mt-8 sm:gap-3">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="block h-full border-2 border-line bg-panel px-3 py-2.5 transition-colors hover:border-mint sm:px-4 sm:py-3">
              <p className="font-display text-3xl leading-none text-white sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">{s.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <ContinueReadingSection />

      <section className="mt-12">
        <SectionHeader title="Your library" action="Open library" href="/library">
          {saved.length > 0 && <span className="pb-0.5 text-sm text-slate-400">{saved.length} saved</span>}
        </SectionHeader>
        {saved.length ? (
          <ComicGrid comics={saved} limit={5} />
        ) : (
          <p className="text-sm text-slate-400">
            Nothing saved yet. Tap the bookmark on any Mafiki, or{" "}
            <Link href="/discover" className="font-semibold text-mint underline-offset-4 hover:underline">find something to read</Link>.
          </p>
        )}
      </section>

      <section className="mt-12">
        <SectionHeader title="Following" action={followed.length ? "See all" : null} href="/library?tab=following" />
        {followed.length ? (
          <ul className="flex flex-wrap gap-3">
            {followed.map(({ creator }) => (
              <li key={creator.username}>
                <Link
                  href={creatorHref(creator.username)}
                  className="flex items-center gap-2.5 border-2 border-line bg-panel py-1.5 pl-1.5 pr-4 transition-colors hover:border-mint"
                >
                  <CreatorAvatar creator={creator} className="h-9 w-9 text-sm" />
                  <span className="text-sm font-semibold text-white">{creator.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            Follow creators from their shorts or profile.{" "}
            <Link href="/creators" className="font-semibold text-mint underline-offset-4 hover:underline">Browse creators</Link>
          </p>
        )}
      </section>
    </>
  );
}
