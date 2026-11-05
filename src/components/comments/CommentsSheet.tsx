"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { CommentRow, CommentsError, Composer, MockCommentRow, NoComments, useCommentThread } from "@/components/comments/CommentParts";
import type { CommentTarget } from "@/lib/api/readerActions";
import { useMockComments, useMockSession, useReaderActionsLive } from "@/lib/mockSession";

type CommentsSheetProps = {
  target: CommentTarget;
  // The backend's key for the thread (a short's uuid, a comic's or episode's id).
  liveKey: string;
  // Where the demo keeps comments in this browser when reader actions are off.
  mockKey: string;
  title: string;
  onClose: () => void;
};

// A whole comment thread: bottom sheet on phones, side panel on desktop, scrolling inside itself so a
// long thread never stretches the page. With reader actions live it shows the real comments; otherwise
// only what you post here (stored in this browser, like likes and the library).
// Drawn at the end of <body>: inside the /shorts page's feed it would sit under the site header.
export function CommentsSheet({ target, liveKey, mockKey, title, onClose }: CommentsSheetProps) {
  const live = useReaderActionsLive();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={`Comments on ${title}`}>
      <button type="button" aria-label="Close comments" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="slide-up absolute inset-x-0 bottom-0 flex h-[65dvh] flex-col border-t-2 border-mint bg-ink md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[400px] md:border-l-2 md:border-t-0">
        {live ? (
          <LiveComments target={target} liveKey={liveKey} title={title} onClose={onClose} />
        ) : (
          <MockComments mockKey={mockKey} title={title} onClose={onClose} />
        )}
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

const composerClass = "border-t-2 border-line p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]";

function LiveComments({ target, liveKey, title, onClose }: { target: CommentTarget; liveKey: string; title: string; onClose: () => void }) {
  const { user, thread, busy, error, post, isYou } = useCommentThread(target, liveKey, true);

  return (
    <>
      <Header count={thread.status === "ready" ? thread.total : null} onClose={onClose} />
      <ul className="flex-1 overflow-y-auto px-4 py-2" aria-busy={thread.status === "loading"}>
        {thread.status === "loading" ? (
          <li className="py-10 text-center text-sm text-slate-400">Loading comments…</li>
        ) : thread.status === "error" ? (
          <CommentsError onRetry={thread.retry} />
        ) : thread.comments.length === 0 ? (
          <NoComments title={title} className="h-full" />
        ) : (
          <>
            {thread.comments.map((comment) => (
              <CommentRow key={comment.id} comment={comment} you={isYou(comment)} />
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
      <Composer placeholder={user ? "Add a comment…" : "Sign in to comment…"} busy={busy} onPost={post} className={composerClass} />
    </>
  );
}

function MockComments({ mockKey, title, onClose }: { mockKey: string; title: string; onClose: () => void }) {
  const { user, signIn } = useMockSession();
  const { comments, add } = useMockComments(mockKey);

  return (
    <>
      <Header count={comments.length} onClose={onClose} />
      <ul className="flex-1 overflow-y-auto px-4 py-2">
        {comments.length === 0 ? (
          <NoComments title={title} className="h-full" />
        ) : (
          comments.map((comment) => <MockCommentRow key={comment.id} comment={comment} user={user} />)
        )}
      </ul>
      <Composer
        placeholder={user ? "Add a comment…" : "Add a comment (signs you in)…"}
        onPost={(text) => {
          if (!user) signIn();
          add(text);
          return true;
        }}
        className={composerClass}
      />
    </>
  );
}
