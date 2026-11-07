"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteComicAction, deleteEpisodeAction, saveComicDetailsAction, setComicPublishedAction } from "@/app/actions/studio";
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
      return true;
    },
  };
}

// The creator's real shorts (mode "live") come from the server and aren't kept in this browser. Saving
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

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

// The creator's real Mafiki (mode "live"). A save works out what changed against the server's copy and
// sends that: details, publishing, deleted episodes. Until the refreshed page arrives the saved
// version shows (`pending`, matched to the server copy it was made from); a failure drops it and says
// why. Changes the backend can't take yet (new images, episode order, ads, ad spaces) are refused.
function useLiveComics(seeds: StudioComic[]) {
  const router = useRouter();
  const [pending, setPending] = useState<Record<string, { item: StudioComic | null; from: string }>>({});
  const seedOf = (id: string) => seeds.find((c) => c.id === id) ?? null;
  const shown = (seed: StudioComic) => {
    const p = pending[seed.id];
    return p && p.from === seed.updatedAt ? p.item : seed;
  };
  const items = seeds
    .map(shown)
    .filter((c): c is StudioComic => c !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const run = async (seed: StudioComic, next: StudioComic | null, steps: (() => Promise<{ ok: boolean; message?: string }>)[], done: string) => {
    setPending((all) => ({ ...all, [seed.id]: { item: next, from: seed.updatedAt } }));
    for (const step of steps) {
      const result = await step();
      if (!result.ok) {
        setPending((all) => Object.fromEntries(Object.entries(all).filter(([id]) => id !== seed.id)));
        studioNotice(result.message ?? "That didn't save. Please try again.");
        router.refresh();
        return false;
      }
    }
    studioNotice(done);
    router.refresh();
    return true;
  };

  const save = (next: StudioComic) => {
    const seed = seedOf(next.id);
    if (!seed?.apiId) return studioNotice("Creating a Mafiki here isn't connected yet.");
    const apiId = seed.apiId;
    const kept = new Set(next.episodes.map((e) => e.id));
    const removed = seed.episodes.filter((e) => !kept.has(e.id));
    const remaining = seed.episodes.filter((e) => kept.has(e.id));
    const unsupported =
      !sameList(remaining.map((e) => e.id), next.episodes.map((e) => e.id)) ||
      next.episodes.some((e) => {
        const before = seed.episodes.find((b) => b.id === e.id);
        return !before || before.ads !== e.ads || before.title !== e.title;
      }) ||
      !sameList(seed.adSpots ?? [], next.adSpots ?? []) ||
      (next.trailer ?? null) !== (seed.trailer ?? null);
    if (unsupported) return studioNotice("That change isn't connected yet. Nothing was changed.");
    // The backend's update ignores the status (checked 5 Nov), so Completed can't be saved yet.
    if ((next.status === "completed") !== (seed.status === "completed")) {
      return studioNotice("Marking a Mafiki completed can't be saved yet (the backend ignores it). Nothing was changed.");
    }

    const steps: (() => Promise<{ ok: boolean; message?: string }>)[] = [];
    const completed = seed.status === "completed";
    const detailsChanged =
      next.title !== seed.title ||
      next.synopsis !== seed.synopsis ||
      next.schedule !== seed.schedule ||
      next.cover !== seed.cover ||
      next.banner !== seed.banner ||
      !sameList(next.genres, seed.genres);
    if (detailsChanged) {
      const { title, synopsis, genres, schedule, cover, banner } = next;
      steps.push(() => saveComicDetailsAction(apiId, { title, synopsis, genres, schedule, cover, banner, completed }));
    }
    if ((next.status === "draft") !== (seed.status === "draft")) steps.push(() => setComicPublishedAction(apiId, next.status !== "draft"));
    removed.forEach((e) => steps.push(() => deleteEpisodeAction(apiId, Number(e.id))));
    if (steps.length === 0) return;

    const done =
      seed.status === "draft" && next.status !== "draft" ? "Published. Readers can find it now." :
      seed.status !== "draft" && next.status === "draft" ? "Unpublished." :
      removed.length ? "Episode deleted." : "Saved.";
    void run(seed, next, steps, done);
  };

  // Resolves once the backend has it (true) or refused it, so the page can move on afterwards.
  const remove = async (comic: StudioComic) => {
    const seed = seedOf(comic.id);
    if (!seed?.apiId) return false;
    const apiId = seed.apiId;
    return run(seed, null, [() => deleteComicAction(apiId)], `Deleted "${seed.title}".`);
  };

  return { items, get: (id: string) => items.find((c) => c.id === id) ?? null, save, remove };
}

export function useStudioComics(mode: StudioMode, seeds: StudioComic[]) {
  const local = useStudioItems(`tc-studio-comics-${mode}`, seeds, (c) => [c.cover, c.banner, c.trailer ?? null, ...c.episodes.flatMap((e) => [...e.pages, e.thumbnail ?? null])]);
  const store = useLiveComics(seeds);
  return mode === "live" ? { ...store, comics: store.items } : { ...local, comics: local.items };
}

export function useStudioShorts(mode: StudioMode, seeds: StudioShort[]) {
  const local = useStudioItems(`tc-studio-shorts-${mode}`, seeds, (s) => [s.video, s.cover]);
  const store = useLiveItems(seeds);
  return mode === "live" ? { ...store, shorts: store.items } : { ...local, shorts: local.items };
}
