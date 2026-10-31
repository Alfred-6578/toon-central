"use client";

import { deleteStoredImage } from "@/lib/imageStore";
import { useLocalValue } from "@/lib/localValue";
import type { StudioComic, StudioMode, StudioShort } from "@/lib/studioModel";

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

export function useStudioComics(mode: StudioMode, seeds: StudioComic[]) {
  const store = useStudioItems(`tc-studio-comics-${mode}`, seeds, (c) => [c.cover, c.banner, c.trailer ?? null, ...c.episodes.flatMap((e) => e.pages)]);
  return { ...store, comics: store.items };
}

export function useStudioShorts(mode: StudioMode, seeds: StudioShort[]) {
  const store = useStudioItems(`tc-studio-shorts-${mode}`, seeds, (s) => [s.video, s.cover]);
  return { ...store, shorts: store.items };
}
