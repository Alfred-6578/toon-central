"use client";

import { useEffect, useState } from "react";

// Once per creator per visit (React's dev double effect and tab switches reuse it): each call counts
// a profile view on the backend.
const opened = new Map<number, Promise<string | null>>();

function openCreator(creatorId: number) {
  if (!opened.has(creatorId)) {
    opened.set(
      creatorId,
      fetch(`/api/creators/${creatorId}/open`, { method: "POST" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { bio?: string | null } | null) => data?.bio ?? null)
        .catch(() => null)
    );
  }
  return opened.get(creatorId)!;
}

// The creator's bio from their profile, fetched once the page is open (so crawlers never count a view).
export function CreatorBio({ creatorId, live }: { creatorId: number | undefined; live: boolean }) {
  const [bio, setBio] = useState<string | null | undefined>(live && creatorId ? undefined : null);

  useEffect(() => {
    if (!live || !creatorId) return;
    let current = true;
    openCreator(creatorId).then((text) => current && setBio(text));
    return () => {
      current = false;
    };
  }, [live, creatorId]);

  if (bio === undefined) return <span aria-hidden="true" className="mt-3 block h-4 w-56 max-w-full animate-pulse bg-white/10" />;
  if (!bio) return null;
  return <p className="mt-3 max-w-2xl whitespace-pre-line text-base leading-7 text-slate-300">{bio}</p>;
}
