"use client";

import { CommentsSheet } from "@/components/comments/CommentsSheet";
import type { Short } from "@/lib/api/types";

// A short's comments, in the shared comments panel.
export function CommentsDrawer({ short, onClose }: { short: Short; onClose: () => void }) {
  return <CommentsSheet target="short" liveKey={short.uuid} mockKey={short.uuid} title={short.title} onClose={onClose} />;
}
