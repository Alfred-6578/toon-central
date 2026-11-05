"use client";

import { useEffect, useRef, useState } from "react";
import { CommentRow, CommentsError, Composer, MockCommentRow, NoComments, useCommentThread } from "@/components/comments/CommentParts";
import { CommentsSheet } from "@/components/comments/CommentsSheet";
import type { CommentTarget } from "@/lib/api/readerActions";
import { useHydrated, useMockComments, useMockSession, useReaderActionsLive } from "@/lib/mockSession";

// How many of the newest comments show on the page; the rest open in the comments panel.
const PREVIEW = 3;

type CommentSectionProps = {
  target: Exclude<CommentTarget, "short">;
  // The backend's id for the comic or episode; without it (stand-in episodes) a live page shows no section.
  liveKey: number | null;
  // Where the demo keeps comments in this browser when reader actions are off.
  mockKey: string;
  title: string;
  className?: string;
};

// Comments under a comic's episode list or at the end of an episode: the box to post and the newest few,
// with the whole thread in the comments panel so a long one never stretches the page. With reader
// actions live they're the backend's, loaded once the section comes near the screen; otherwise only
// what you post here.
export function CommentSection({ target, liveKey, mockKey, title, className = "" }: CommentSectionProps) {
  const hydrated = useHydrated();
  const live = useReaderActionsLive();
  const [open, setOpen] = useState(false);
  if (!hydrated || (live && !liveKey)) return null;

  return (
    <section aria-labelledby={`${target}-comments-title`} className={className}>
      {live && liveKey ? (
        <LiveSection target={target} liveKey={liveKey} title={title} onViewAll={() => setOpen(true)} />
      ) : (
        <MockSection target={target} mockKey={mockKey} title={title} onViewAll={() => setOpen(true)} />
      )}
      {open && <CommentsSheet target={target} liveKey={String(liveKey)} mockKey={mockKey} title={title} onClose={() => setOpen(false)} />}
    </section>
  );
}

function Heading({ target, count }: { target: CommentTarget; count: number | null }) {
  return (
    <div className="mb-4 flex items-end gap-3 border-b-2 border-line pb-3">
      <h2 id={`${target}-comments-title`} className="font-display text-3xl uppercase leading-none text-white sm:text-4xl">Comments</h2>
      {count != null && <span className="pb-0.5 text-sm text-slate-400">{count}</span>}
    </div>
  );
}

function ViewAll({ total, onClick }: { total: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-ghost mt-3 w-full py-2.5 text-sm sm:w-auto sm:px-6">
      View all {total} comments
    </button>
  );
}

type SectionProps = { target: Exclude<CommentTarget, "short">; title: string; onViewAll: () => void };

function LiveSection({ target, liveKey, title, onViewAll }: SectionProps & { liveKey: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: "600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [near]);

  const { user, thread, busy, error, post, isYou } = useCommentThread(target, String(liveKey), near);

  return (
    <div ref={ref}>
      <Heading target={target} count={thread.status === "ready" ? thread.total : null} />
      <Composer placeholder={user ? "Add a comment…" : "Sign in to comment…"} busy={busy} onPost={post} />
      {error && <p role="alert" className="mt-2 text-sm text-sun">{error}</p>}
      <ul className="mt-2" aria-busy={thread.status === "loading"}>
        {thread.status === "loading" ? (
          <li className="py-8 text-center text-sm text-slate-400">Loading comments…</li>
        ) : thread.status === "error" ? (
          <CommentsError onRetry={thread.retry} />
        ) : thread.comments.length === 0 ? (
          <NoComments title={title} className="py-8" />
        ) : (
          thread.comments.slice(0, PREVIEW).map((comment) => <CommentRow key={comment.id} comment={comment} you={isYou(comment)} />)
        )}
      </ul>
      {thread.status === "ready" && thread.total > PREVIEW && <ViewAll total={thread.total} onClick={onViewAll} />}
    </div>
  );
}

function MockSection({ target, mockKey, title, onViewAll }: SectionProps & { mockKey: string }) {
  const { user, signIn } = useMockSession();
  const { comments, add } = useMockComments(mockKey);

  return (
    <>
      <Heading target={target} count={comments.length} />
      <Composer
        placeholder={user ? "Add a comment…" : "Add a comment (signs you in)…"}
        onPost={(text) => {
          if (!user) signIn();
          add(text);
          return true;
        }}
      />
      <ul className="mt-2">
        {comments.length === 0 ? (
          <NoComments title={title} className="py-8" />
        ) : (
          comments.slice(0, PREVIEW).map((comment) => <MockCommentRow key={comment.id} comment={comment} user={user} />)
        )}
      </ul>
      {comments.length > PREVIEW && <ViewAll total={comments.length} onClick={onViewAll} />}
    </>
  );
}
