"use client";

import { useState } from "react";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { Avatar } from "@/components/layout/nav/Menus";
import { CreatorAvatar } from "@/components/ui/CreatorAvatar";
import { ExpandableText } from "@/components/ui/ExpandableText";
import type { PublicComment } from "@/lib/api/readerActions";
import { timeAgo } from "@/lib/format";
import { useComments } from "@/lib/comments";
import { useMockSession, type MockUser } from "@/lib/mockSession";

// The pieces every comment list shares: the shorts drawer and the comic and episode sections.

export const COMMENT_MAX = 300;

export function CommentRow({ comment, you }: { comment: PublicComment; you: boolean }) {
  return (
    <li className="flex gap-3 border-b-2 border-line py-3 last:border-b-0">
      <CreatorAvatar creator={comment.user} className="h-8 w-8 shrink-0 text-[11px]" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-white">{you ? "You" : comment.user.username}</span>
          {comment.at && <> · {timeAgo(comment.at)}</>}
        </p>
        <CommentText text={comment.text} />
      </div>
    </li>
  );
}

// Ours are capped at COMMENT_MAX, but ones posted elsewhere (the app, the API) can be any length.
function CommentText({ text }: { text: string }) {
  return (
    <ExpandableText
      text={text}
      clamp="line-clamp-4"
      labels={["Read more", "Show less"]}
      className="mt-1 whitespace-pre-line break-words text-sm leading-5 text-slate-200"
      buttonClassName="mt-1 text-xs font-bold text-mint hover:underline"
    />
  );
}

// A comment posted in the demo (reader actions off), kept in this browser.
export function MockCommentRow({ comment, user }: { comment: { text: string; at: string }; user: MockUser | null }) {
  return (
    <li className="flex gap-3 border-b-2 border-line py-3 last:border-b-0">
      {user && <Avatar user={user} className="h-8 w-8 shrink-0 text-[11px]" />}
      <div className="min-w-0">
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-white">You</span> · {timeAgo(comment.at)}
        </p>
        <CommentText text={comment.text} />
      </div>
    </li>
  );
}

export function NoComments({ title, className = "" }: { title: string; className?: string }) {
  return (
    <li className={`flex flex-col items-center justify-center gap-3 text-center text-slate-400 ${className}`}>
      <IoChatbubbleEllipsesOutline className="text-4xl" />
      <p className="font-semibold text-white">No comments yet</p>
      <p className="text-sm">Be the first to say something about {title}.</p>
    </li>
  );
}

export function CommentsError({ onRetry }: { onRetry: () => void }) {
  return (
    <li className="flex flex-col items-center gap-3 py-10 text-center text-sm text-slate-400">
      Couldn&apos;t load the comments.
      <button type="button" onClick={onRetry} className="font-bold text-mint hover:underline">Try again</button>
    </li>
  );
}

type ComposerProps = { placeholder: string; busy?: boolean; onPost: (text: string) => Promise<boolean> | boolean; className?: string };

export function Composer({ placeholder, busy, onPost, className = "" }: ComposerProps) {
  const [draft, setDraft] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const text = draft.trim();
        if (text && (await onPost(text.slice(0, COMMENT_MAX)))) setDraft("");
      }}
      className={`flex gap-2 ${className}`}
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={COMMENT_MAX}
        placeholder={placeholder}
        aria-label="Your comment"
        className="h-11 min-w-0 flex-1 rounded-[3px] border-2 border-line bg-panel px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-mint"
      />
      <button type="submit" disabled={!draft.trim() || busy} className="btn btn-primary h-11 px-4 disabled:opacity-40">
        {busy ? "Posting…" : "Post"}
      </button>
    </form>
  );
}

// A live thread plus posting to it: signed-out readers are sent to sign in, failures come back as a
// message to show.
export function useCommentThread(...args: Parameters<typeof useComments>) {
  const { user, signIn } = useMockSession();
  const thread = useComments(...args);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async (text: string) => {
    if (!user) {
      signIn();
      return false;
    }
    setBusy(true);
    setError(null);
    const result = await thread.post(text);
    setBusy(false);
    if (!result.ok) setError(result.message);
    return result.ok;
  };

  return { user, thread, busy, error, post, isYou: (comment: PublicComment) => !!user && comment.user.username === user.username };
}
