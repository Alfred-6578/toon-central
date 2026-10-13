"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { IoLockClosed } from "react-icons/io5";
import { authHref } from "@/lib/auth";
import { useMockSession, writeSessionCookie } from "@/lib/mockSession";

type ReaderGateProps = {
  episode: number;
  firstEpisodeHref: string;
};

// Shown where the server stopped sending pages. Signing in (mock) sets the session cookie, then
// asks the server to re-render: the unlocked pages arrive from the server, not from un-hiding.
export function ReaderGate({ episode, firstEpisodeHref }: ReaderGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useMockSession();

  const synced = useRef(false);

  // Signed in from an earlier visit (localStorage) but the cookie is missing: sync it and re-render.
  // Once only, so blocked cookies can't cause a refresh loop.
  useEffect(() => {
    if (!user || synced.current) return;
    synced.current = true;
    writeSessionCookie(true);
    router.refresh();
  }, [user, router]);

  return (
    <div className="relative -mt-72 bg-gradient-to-b from-transparent via-ink/95 to-ink px-6 pb-14 pt-56 text-center">
      <span className="tag -rotate-2 gap-1.5 bg-sun text-sm"><IoLockClosed /> Premium episode</span>
      <h2 className="mx-auto mt-4 max-w-md font-display text-4xl uppercase leading-none text-white sm:text-5xl">
        Keep reading episode {episode}
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-300">
        That&apos;s the free preview. A pass or plan unlocks the rest of this episode and every locked chapter, from{" "}
        <span className="font-bold text-mint">₦100 a day</span>.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/subscription" className="btn btn-primary px-6 py-3 text-base">Subscribe</Link>
        <Link href={authHref("signin", pathname)} className="btn btn-ghost px-6 py-3 text-base">
          Already subscribed? Sign in
        </Link>
      </div>
      <p className="mt-6 text-xs text-slate-500">
        Or start from the beginning: <Link href={firstEpisodeHref} className="font-semibold text-slate-300 underline-offset-4 hover:underline">episode 1 is free</Link>
      </p>
    </div>
  );
}
