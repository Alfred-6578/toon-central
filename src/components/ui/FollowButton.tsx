"use client";

import { IoAdd, IoCheckmark } from "react-icons/io5";
import { useMockFollows, useMockSession } from "@/lib/mockSession";

// Follow a creator (keyed by username, shared with Shorts and the library's Following tab). Signed out,
// it flips the mock sign-in first. `small` sits beside a byline; the default sits in a page header.
export function FollowButton({ username, small = false }: { username: string; small?: boolean }) {
  const { user, signIn } = useMockSession();
  const follows = useMockFollows();
  const following = follows.has(username);

  return (
    <button
      type="button"
      onClick={() => {
        if (!user) signIn();
        follows.toggle(username);
      }}
      aria-pressed={following}
      aria-label={following ? `Unfollow ${username}` : `Follow ${username}`}
      className={
        small
          ? `flex items-center gap-1 border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              following ? "border-line text-slate-300 hover:border-white/60" : "border-black bg-mint text-ink hover:-translate-y-px"
            }`
          : `btn gap-2 px-5 py-2.5 text-base ${following ? "btn-ghost" : "btn-primary"}`
      }
    >
      {following ? <IoCheckmark /> : <IoAdd />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
