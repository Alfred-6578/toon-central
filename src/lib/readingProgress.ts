"use client";

import { useSyncExternalStore } from "react";

// Where the reader left off in each comic, kept in this browser (localStorage) until accounts
// can sync it. One entry per comic: the latest episode and page they reached.
export type ReadingProgress = {
  uuid: string;
  title: string;
  coverImage: string;
  episode: number;
  page: number;
  pagesInEpisode: number;
  totalEpisodes: number | null;
  // They finished `episode` and the next one is waiting: resume opens episode + 1 at page 1.
  finished: boolean;
  updatedAt: number;
};

const KEY = "tc-reading-progress";
// Also the library's reading history, so keep plenty; older comics fall off.
const MAX_COMICS = 50;

const listeners = new Set<() => void>();
let memory = "{}";

function read() {
  try {
    return localStorage.getItem(KEY) ?? "{}";
  } catch {
    return memory;
  }
}

function write(all: Record<string, ReadingProgress>) {
  const kept = Object.values(all)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_COMICS);
  memory = JSON.stringify(Object.fromEntries(kept.map((p) => [p.uuid, p])));
  try {
    localStorage.setItem(KEY, memory);
  } catch {
    // In-memory fallback only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const parse = (raw: string): Record<string, ReadingProgress> => {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export function saveProgress(entry: Omit<ReadingProgress, "updatedAt">) {
  write({ ...parse(read()), [entry.uuid]: { ...entry, updatedAt: Date.now() } });
}

export function removeProgress(uuid: string) {
  const all = parse(read());
  delete all[uuid];
  write(all);
}

export function clearProgress() {
  write({});
}

// Where "Resume" should take the reader.
export function resumeTarget(p: ReadingProgress) {
  return p.finished ? { episode: p.episode + 1, page: 1 } : { episode: p.episode, page: p.page };
}

export function useReadingProgress(): ReadingProgress[] {
  const raw = useSyncExternalStore(subscribe, read, () => "{}");
  return Object.values(parse(raw)).sort((a, b) => b.updatedAt - a.updatedAt);
}
