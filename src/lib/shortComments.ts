"use client";

import { useEffect, useSyncExternalStore } from "react";
import { addShortCommentAction, shortCommentsAction } from "@/app/actions/reader";
import type { PublicComment } from "@/lib/api/readerActions";

// Live comments on a short (reader actions live). One copy per short per page load, shared by the
// feed's comment count and the comments drawer.
type Thread = { status: "loading" | "ready" | "error"; comments: PublicComment[]; total: number; page: number; totalPages: number };

const threads = new Map<string, Thread>();
const listeners = new Set<() => void>();
const EMPTY: Thread = { status: "loading", comments: [], total: 0, page: 0, totalPages: 0 };

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

function put(uuid: string, thread: Thread) {
  threads.set(uuid, thread);
  listeners.forEach((listener) => listener());
}

async function fetchPage(uuid: string, page: number) {
  const current = threads.get(uuid) ?? EMPTY;
  const result = await shortCommentsAction(uuid, page);
  if (!result) {
    put(uuid, { ...current, status: page === 1 ? "error" : "ready" });
    return;
  }
  const comments = page === 1 ? result.comments : [...current.comments, ...result.comments.filter((c) => !current.comments.some((x) => x.id === c.id))];
  put(uuid, { status: "ready", comments, total: result.total, page, totalPages: result.totalPages });
}

export function useShortComments(uuid: string, enabled: boolean) {
  const thread = useSyncExternalStore(subscribe, () => threads.get(uuid) ?? EMPTY, () => EMPTY);

  useEffect(() => {
    if (!enabled || threads.has(uuid)) return;
    threads.set(uuid, EMPTY);
    fetchPage(uuid, 1);
  }, [enabled, uuid]);

  return {
    ...thread,
    hasMore: thread.page < thread.totalPages,
    loadMore: () => fetchPage(uuid, thread.page + 1),
    retry: () => fetchPage(uuid, 1),
    // Posts, then reloads the first page so the new comment shows as the backend stored it.
    post: async (text: string) => {
      const result = await addShortCommentAction(uuid, text);
      if (result.ok) await fetchPage(uuid, 1);
      return result;
    },
  };
}
