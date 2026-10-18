"use client";

import { useState, type MouseEvent } from "react";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { formatCount } from "@/lib/format";
import { useMockComicLikes, useMockSession } from "@/lib/mockSession";
import { HEART_BURST_MS, HeartBurst } from "./HeartBurst";

type Burst = { id: number; x: number; y: number };

// Like a comic. Liking (not unliking) sets off the heart burst. Signed out, it flips the mock sign-in
// first, like the library button. `cell` is the count in the comic page's stat bar; `icon` is the
// square reader top-bar button.
export function LikeButton({ uuid, title, likes, variant = "cell" }: { uuid: string; title: string; likes?: number; variant?: "cell" | "icon" }) {
  const { user, signIn } = useMockSession();
  const liked = useMockComicLikes();
  const isLiked = liked.has(uuid);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [popKey, setPopKey] = useState(0);

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!user) signIn();
    liked.toggle(uuid);
    if (isLiked) return;
    setPopKey((k) => k + 1);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const burst = { id: event.timeStamp, x: box.left + box.width / 2, y: box.top + box.height / 2 };
    setBursts((all) => [...all, burst]);
    setTimeout(() => setBursts((all) => all.filter((b) => b.id !== burst.id)), HEART_BURST_MS);
  };

  const Icon = isLiked ? IoHeart : IoHeartOutline;
  const count = likes == null ? null : likes + (isLiked ? 1 : 0);

  return (
    <>
      {variant === "cell" ? (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={isLiked}
          aria-label={`${isLiked ? "Unlike" : "Like"} ${title}${count == null ? "" : `, ${count} likes`}`}
          title={user ? undefined : "Signs you in and likes this comic"}
          className="flex items-center gap-2 px-4 font-display text-base uppercase tracking-[0.03em] text-white transition-colors hover:bg-white/10"
        >
          <Icon key={popKey} className={`text-lg ${isLiked ? "like-pop text-mint" : ""}`} />
          {count == null ? (isLiked ? "Liked" : "Like") : formatCount(count)}
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={isLiked}
          aria-label={isLiked ? `Unlike ${title}` : `Like ${title}`}
          title={isLiked ? "You like this" : "Like"}
          className={`flex h-9 w-9 items-center justify-center border-2 text-lg transition-colors ${
            isLiked ? "border-black bg-mint text-ink shadow-[2px_2px_0_var(--color-mint-deep)]" : "border-line text-slate-200 hover:border-mint hover:text-white"
          }`}
        >
          <Icon key={popKey} className={isLiked ? "like-pop" : ""} />
        </button>
      )}
      {bursts.map((b) => (
        <HeartBurst key={b.id} x={b.x} y={b.y} />
      ))}
    </>
  );
}
