"use client";

import { deleteStoredImage } from "@/lib/imageStore";
import { useLocalValue } from "@/lib/localValue";
import type { StudioComic, StudioMode, StudioShort } from "@/lib/studioModel";
import { studioNotice } from "@/components/studio/StudioNotice";

type Item = { id: string; updatedAt: string };

// A creator's items: the demo's real ones (if any) with this browser's edits laid over them, plus
// items created here. One store per kind and demo mode, so they never mix.
function useStudioItems<T extends Item>(key: string, seeds: T[], files: (item: T) => (string | null)[]) {
  const [raw, setRaw] = useLocalValue(key, "{}");
  let saved: Record<string, T | { deleted: true }> = {};
  try {
    saved = JSON.parse(raw);
  } catch {
    saved = {};
  }

  const seedIds = new Set(seeds.map((s) => s.id));
  const items = [
    ...seeds.map((seed) => saved[seed.id] ?? seed),
    ...Object.entries(saved)
      .filter(([id]) => !seedIds.has(id))
      .map(([, item]) => item),
  ]
    .filter((item): item is T => !("deleted" in item))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const write = (next: typeof saved) => setRaw(JSON.stringify(next));

  return {
    items,
    get: (id: string) => items.find((item) => item.id === id) ?? null,
    save: (item: T) => write({ ...saved, [item.id]: { ...item, updatedAt: new Date().toISOString() } }),
    remove: (item: T) => {
      files(item).forEach((ref) => ref && deleteStoredImage(ref));
      write({ ...saved, [item.id]: { deleted: true } });
    },
  };
}

// The creator's real items (mode "live") come from the server and aren't kept in this browser. Saving
// them isn't connected yet, so changes are refused with a note instead of being kept only here.
function useLiveItems<T extends Item>(seeds: T[]) {
  const refuse: (item: T) => void = () => studioNotice("Saving to your account isn't connected yet. Nothing was changed.");
  return {
    items: [...seeds].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    get: (id: string) => seeds.find((item) => item.id === id) ?? null,
    save: refuse,
    remove: refuse,
  };
}

export function useStudioComics(mode: StudioMode, seeds: StudioComic[]) {
  const local = useStudioItems(`tc-studio-comics-${mode}`, seeds, (c) => [c.cover, c.banner, c.trailer ?? null, ...c.episodes.flatMap((e) => [...e.pages, e.thumbnail ?? null])]);
  const store = useLiveItems(seeds);
  return mode === "live" ? { ...store, comics: store.items } : { ...local, comics: local.items };
}

export function useStudioShorts(mode: StudioMode, seeds: StudioShort[]) {
  const local = useStudioItems(`tc-studio-shorts-${mode}`, seeds, (s) => [s.video, s.cover]);
  const store = useLiveItems(seeds);
  return mode === "live" ? { ...store, shorts: store.items } : { ...local, shorts: local.items };
}
