"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  IoAdd,
  IoBookmark,
  IoBookmarkOutline,
  IoChatbubbleEllipses,
  IoCheckmark,
  IoHeart,
  IoHeartOutline,
  IoShareSocial,
  IoVolumeHighOutline,
  IoVolumeMuteOutline,
} from "react-icons/io5";
import { CreatorAvatar } from "@/components/ui/CreatorAvatar";
import type { Short } from "@/lib/api/types";
import { cloudinary, comicHref, creatorHref, formatCount } from "@/lib/format";

type ActionRailProps = {
  short: Short;
  liked: boolean;
  saved: boolean;
  following: boolean;
  comments: number;
  playing: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onLike: () => void;
  onSave: () => void;
  onFollow: () => void;
  onComments: () => void;
  onShare: () => void;
  className?: string;
};

function RailButton({
  label,
  count,
  active = false,
  onClick,
  children,
}: {
  label: string;
  count?: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={active} className="group flex flex-col items-center gap-1">
      <span
        className={`flex h-12 w-12 items-center justify-center border-2 text-2xl transition-transform group-active:scale-90 ${
          active ? "border-black bg-mint text-ink shadow-[3px_3px_0_var(--color-mint-deep)]" : "border-white/25 bg-ink/60 text-white group-hover:border-mint"
        }`}
      >
        {children}
      </span>
      {count && <span className="text-xs font-bold text-white drop-shadow">{count}</span>}
    </button>
  );
}

// TikTok-style column: creator + follow, like, comments, save, share, and the spinning disc. On a short
// made from a comic, the disc is the comic's cover and opens the comic ("what's this story?").
export function ActionRail({ short, liked, saved, following, comments, playing, muted, onToggleMute, onLike, onSave, onFollow, onComments, onShare, className = "" }: ActionRailProps) {
  const comic = short.linkedComic;
  const ad = short.isSponsored;

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Sound first: it's the control people reach for most. */}
      <RailButton label={muted ? "Unmute" : "Mute"} active={muted} onClick={onToggleMute}>
        {muted ? <IoVolumeMuteOutline /> : <IoVolumeHighOutline />}
      </RailButton>

      {!ad && (
        <div className="relative mb-2">
          <Link href={creatorHref(short.creator.username)} aria-label={`${short.creator.username}'s profile`}>
            <CreatorAvatar creator={short.creator} genre={short.genres[0]} className="h-12 w-12 text-base" />
          </Link>
          <button
            type="button"
            onClick={onFollow}
            aria-label={following ? `Unfollow ${short.creator.username}` : `Follow ${short.creator.username}`}
            aria-pressed={following}
            className={`absolute -bottom-2.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center border-2 border-black text-sm ${
              following ? "bg-paper text-ink" : "bg-mint text-ink"
            }`}
          >
            {following ? <IoCheckmark /> : <IoAdd />}
          </button>
        </div>
      )}

      <RailButton label={liked ? "Unlike" : "Like"} count={formatCount(short.likes + (liked ? 1 : 0))} active={liked} onClick={onLike}>
        {liked ? <IoHeart /> : <IoHeartOutline />}
      </RailButton>
      {!ad && (
        <RailButton label="Comments" count={comments ? String(comments) : "Comment"} onClick={onComments}>
          <IoChatbubbleEllipses />
        </RailButton>
      )}
      <RailButton label={saved ? "Remove from saved" : "Save"} count={saved ? "Saved" : "Save"} active={saved} onClick={onSave}>
        {saved ? <IoBookmark /> : <IoBookmarkOutline />}
      </RailButton>
      <RailButton label="Share" count="Share" onClick={onShare}>
        <IoShareSocial />
      </RailButton>

      {/* The disc: the comic's cover on tie-in shorts, otherwise the creator ("original audio") */}
      <Link
        href={comic ? comicHref(comic.uuid) : creatorHref(short.creator.username)}
        aria-label={comic ? `Read the comic ${comic.title}` : `More from ${short.creator.username}`}
        title={comic ? `From the comic: ${comic.title}` : "Original audio"}
        className="relative mt-1 block h-12 w-12"
      >
        <span
          className="disc-spin block h-12 w-12 overflow-hidden rounded-full border-[6px] border-[#111] bg-[#111] shadow-[0_0_0_2px_rgba(255,255,255,0.15)]"
          style={{ animationPlayState: playing ? "running" : "paused" }}
        >
          <img src={cloudinary(comic ? comic.coverImage : short.coverImage, 120)} alt="" className="h-full w-full rounded-full object-cover" />
        </span>
        {comic && <span className="tag absolute -bottom-2 left-1/2 -translate-x-1/2 bg-sun px-1 text-[9px]">Comic</span>}
      </Link>
    </div>
  );
}
