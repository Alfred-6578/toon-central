"use client";

import { useCallback, useSyncExternalStore } from "react";

// A single string kept in localStorage (a "seen the guide" flag, a preferred speed), shared by every
// component that reads the same key and safe to render on the server (it starts at `fallback`).
const listeners = new Set<() => void>();
const memory = new Map<string, string>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useLocalValue(key: string, fallback: string, serverValue = fallback) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key) ?? fallback;
      } catch {
        return memory.get(key) ?? fallback;
      }
    },
    () => serverValue
  );

  const set = useCallback(
    (next: string) => {
      memory.set(key, next);
      try {
        localStorage.setItem(key, next);
      } catch {
        // Storage unavailable (private mode): the in-memory value still works for this tab.
      }
      listeners.forEach((listener) => listener());
    },
    [key]
  );

  return [value, set] as const;
}
