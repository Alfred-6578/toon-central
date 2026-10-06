"use client";

import { useState } from "react";
import { IoChatbubbleEllipsesOutline, IoClose } from "react-icons/io5";
import { Avatar } from "@/components/layout/nav/Menus";
import type { Short } from "@/lib/api/types";
import { timeAgo } from "@/lib/format";
import { useMockComments, useMockSession } from "@/lib/mockSession";

// Bottom sheet on phones, side panel on desktop. The API snapshot has no comments, so this only ever
// shows what you post here (stored in this browser, like likes and the library).
export function CommentsDrawer({ short, onClose }: { short: Short; onClose: () => void }) {
  const { user, signIn } = useMockSession();
  const { comments, add } = useMockComments(short.uuid);
  const [draft, setDraft] = useState("");

  const post = () => {
    const text = draft.trim();
    if (!text) return;
    if (!user) signIn();
    add(text.slice(0, 300));
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={`Comments on ${short.title}`}>
      <button type="button" aria-label="Close comments" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="slide-up absolute inset-x-0 bottom-0 flex h-[65dvh] flex-col border-t-2 border-mint bg-ink md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[400px] md:border-l-2 md:border-t-0">
        <div className="flex items-center justify-between border-b-2 border-line px-4 py-3">
          <p className="font-display text-xl uppercase leading-none text-white">
            Comments <span className="text-slate-500">{comments.length}</span>
          </p>
          <button type="button" onClick={onClose} aria-label="Close comments" className="text-2xl text-slate-300 hover:text-white">
            <IoClose />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto px-4 py-2">
          {comments.length === 0 ? (
            <li className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400">
              <IoChatbubbleEllipsesOutline className="text-4xl" />
              <p className="font-semibold text-white">No comments yet</p>
              <p className="text-sm">Be the first to say something about {short.title}.</p>
            </li>
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            post();
          }}
          className="flex gap-2 border-t-2 border-line p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={300}
            placeholder={user ? "Add a comment…" : "Add a comment (signs you in)…"}
            className="h-11 min-w-0 flex-1 rounded-[3px] border-2 border-line bg-panel px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-mint"
          />
          <button type="submit" disabled={!draft.trim()} className="btn btn-primary h-11 px-4 disabled:opacity-40">Post</button>
        </form>
      </div>
    </div>
  );
}
