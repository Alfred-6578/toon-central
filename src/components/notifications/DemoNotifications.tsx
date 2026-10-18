"use client";

import Link from "next/link";
import { authHref } from "@/lib/auth";
import { useHydrated, useMockSession } from "@/lib/mockSession";
import { notifyFirstEpisode, notifyNewEpisodeDemo, notifyWelcome, resetDemoNotifications } from "@/lib/notifications";

// Client demo: fire each kind of notification pop-up on demand.
export function DemoNotifications() {
  const hydrated = useHydrated();
  const { user } = useMockSession();
  if (!hydrated) return null;
  if (!user) {
    return (
      <p className="mt-4 text-sm text-slate-400">
        Notifications are for signed-in readers.{" "}
        <Link href={authHref("signin", "/preview/loading")} className="font-semibold text-mint hover:underline">Sign in</Link> to try them.
      </p>
    );
  }
  const fire = (fn: () => void) => () => {
    resetDemoNotifications();
    fn();
  };
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" onClick={fire(() => notifyWelcome(user.name))} className="btn btn-primary px-5 py-3">Welcome</button>
      <button type="button" onClick={fire(() => notifyFirstEpisode("ODOGWU", "/comics/4c06eec3-c5a8-4c4c-b2e0-2aaad1478f01/read/2"))} className="btn btn-primary px-5 py-3">
        Congratulations
      </button>
      <button type="button" onClick={notifyNewEpisodeDemo} className="btn btn-primary px-5 py-3">New episode</button>
      <Link href="/notifications" className="btn btn-ghost px-5 py-3">All notifications</Link>
    </div>
  );
}
