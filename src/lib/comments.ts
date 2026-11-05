"use client";

import { useEffect, useSyncExternalStore } from "react";
import { addCommentAction, commentsAction } from "@/app/actions/reader";
import type { CommentTarget, PublicComment } from "@/lib/api/readerActions";

// Live comments on a short, comic or episode (reader actions live). One copy per thread per page load,
// shared by everything showing it (the shorts feed's count and its comments drawer, for one).
type Thread = { status: "loading" | "ready" | "error"; comments: PublicComment[]; total: number; page: number; totalPages: number };

const threads = new Map<string, Thread>();
const listeners = new Set<() => void>();
const EMPTY: Thread = { status: "loading", comments: [], total: 0, page: 0, totalPages: 0 };

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

function put(id: string, thread: Thread) {
  threads.set(id, thread);
  listeners.forEach((listener) => listener());
}

async function fetchPage(target: CommentTarget, key: string, page: number) {
  const id = `${target}:${key}`;
  const current = threads.get(id) ?? EMPTY;
  const result = await commentsAction(target, key, page);
  if (!result) {
    put(id, { ...current, status: page === 1 ? "error" : "ready" });
    return;
  }
  const comments = page === 1 ? result.comments : [...current.comments, ...result.comments.filter((c) => !current.comments.some((x) => x.id === c.id))];
  put(id, { status: "ready", comments, total: result.total, page, totalPages: result.totalPages });
}

export function useComments(target: CommentTarget, key: string, enabled: boolean) {
  const id = `${target}:${key}`;
  const thread = useSyncExternalStore(subscribe, () => threads.get(id) ?? EMPTY, () => EMPTY);

  useEffect(() => {
    if (!enabled || threads.has(id)) return;
    threads.set(id, EMPTY);
    fetchPage(target, key, 1);
  }, [enabled, id, target, key]);

  return {
    ...thread,
    hasMore: thread.page < thread.totalPages,
    loadMore: () => fetchPage(target, key, thread.page + 1),
    retry: () => fetchPage(target, key, 1),
    // Posts, then reloads the first page so the new comment shows as the backend stored it.
    post: async (text: string) => {
      const result = await addCommentAction(target, key, text);
      if (result.ok) await fetchPage(target, key, 1);
      return result;
    },
  };
}
