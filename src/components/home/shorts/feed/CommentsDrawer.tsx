"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { IoChatbubbleEllipsesOutline, IoClose } from "react-icons/io5";
import { Avatar } from "@/components/layout/nav/Menus";
import { CreatorAvatar } from "@/components/ui/CreatorAvatar";
import type { Short } from "@/lib/api/types";
import { timeAgo } from "@/lib/format";
import { useMockComments, useMockSession, useReaderActionsLive } from "@/lib/mockSession";
import { useShortComments } from "@/lib/shortComments";

const COMMENT_MAX = 300;

// Bottom sheet on phones, side panel on desktop. With reader actions live it shows the short's real
// comments; otherwise only what you post here (stored in this browser, like likes and the library).
// Drawn at the end of <body>: inside the /shorts page's feed it would sit under the site header.
export function CommentsDrawer({ short, onClose }: { short: Short; onClose: () => void }) {
  const live = useReaderActionsLive();
  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={`Comments on ${short.title}`}>
      <button type="button" aria-label="Close comments" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="slide-up absolute inset-x-0 bottom-0 flex h-[65dvh] flex-col border-t-2 border-mint bg-ink md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[400px] md:border-l-2 md:border-t-0">
        {live ? <LiveComments short={short} onClose={onClose} /> : <MockComments short={short} onClose={onClose} />}
      </div>
    </div>,
    document.body
  );
}

function Header({ count, onClose }: { count: number | null; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-line px-4 py-3">
      <p className="font-display text-xl uppercase leading-none text-white">
        Comments {count != null && <span className="text-slate-500">{count}</span>}
      </p>
      <button type="button" onClick={onClose} aria-label="Close comments" className="text-2xl text-slate-300 hover:text-white">
        <IoClose />
      </button>
    </div>
  );
}

function NoComments({ title }: { title: string }) {
  return (
    <li className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400">
      <IoChatbubbleEllipsesOutline className="text-4xl" />
      <p className="font-semibold text-white">No comments yet</p>
      <p className="text-sm">Be the first to say something about {title}.</p>
    </li>
  );
}

function Composer({ placeholder, busy, onPost }: { placeholder: string; busy?: boolean; onPost: (text: string) => Promise<boolean> | boolean }) {
  const [draft, setDraft] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const text = draft.trim();
        if (text && (await onPost(text.slice(0, COMMENT_MAX)))) setDraft("");
      }}
      className="flex gap-2 border-t-2 border-line p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
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

function LiveComments({ short, onClose }: { short: Short; onClose: () => void }) {
  const { user, signIn } = useMockSession();
  const thread = useShortComments(short.uuid, true);
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

  return (
    <>
      <Header count={thread.status === "ready" ? thread.total : null} onClose={onClose} />
      <ul className="flex-1 overflow-y-auto px-4 py-2" aria-busy={thread.status === "loading"}>
        {thread.status === "loading" ? (
          <li className="py-10 text-center text-sm text-slate-400">Loading comments…</li>
        ) : thread.status === "error" ? (
          <li className="flex flex-col items-center gap-3 py-10 text-center text-sm text-slate-400">
            Couldn&apos;t load the comments.
            <button type="button" onClick={thread.retry} className="font-bold text-mint hover:underline">Try again</button>
          </li>
        ) : thread.comments.length === 0 ? (
          <NoComments title={short.title} />
        ) : (
          <>
            {thread.comments.map((comment) => (
              <li key={comment.id} className="flex gap-3 border-b-2 border-line py-3 last:border-b-0">
                <CreatorAvatar creator={comment.user} className="h-8 w-8 text-[11px]" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-white">{user && comment.user.username === user.username ? "You" : comment.user.username}</span>
                    {comment.at && <> · {timeAgo(comment.at)}</>}
                  </p>
                  <p className="mt-1 whitespace-pre-line break-words text-sm leading-5 text-slate-200">{comment.text}</p>
                </div>
              </li>
            ))}
            {thread.hasMore && (
              <li className="py-3 text-center">
                <button type="button" onClick={thread.loadMore} className="text-sm font-bold text-mint hover:underline">Show older comments</button>
              </li>
            )}
          </>
        )}
      </ul>
      {error && <p role="alert" className="border-t-2 border-line px-4 py-2 text-sm text-sun">{error}</p>}
      <Composer placeholder={user ? "Add a comment…" : "Sign in to comment…"} busy={busy} onPost={post} />
    </>
  );
}

function MockComments({ short, onClose }: { short: Short; onClose: () => void }) {
  const { user, signIn } = useMockSession();
  const { comments, add } = useMockComments(short.uuid);

  return (
    <>
      <Header count={comments.length} onClose={onClose} />
      <ul className="flex-1 overflow-y-auto px-4 py-2">
        {comments.length === 0 ? (
          <NoComments title={short.title} />
        ) : (
          comments.map((comment) => (
            <li key={comment.id} className="flex gap-3 border-b-2 border-line py-3 last:border-b-0">
              {user && <Avatar user={user} className="h-8 w-8 text-[11px]" />}
              <div className="min-w-0">
                <p className="text-xs text-slate-400">
                  <span className="font-semibold text-white">You</span> · {timeAgo(comment.at)}
                </p>
                <p className="mt-1 break-words text-sm leading-5 text-slate-200">{comment.text}</p>
              </div>
            </li>
          ))
        )}
      </ul>
      <Composer
        placeholder={user ? "Add a comment…" : "Add a comment (signs you in)…"}
        onPost={(text) => {
          if (!user) signIn();
          add(text);
          return true;
        }}
      />
    </>
  );
}
