"use client";

import { useSyncExternalStore } from "react";

// Stand-in for real auth: "Sign in" / "Join now" flip this on, "Sign out" flips it off.
// Persisted in localStorage so a refresh keeps the state. Swap for the real session later.
const STORAGE_KEY = "tc-mock-signed-in";

export type MockUser = {
  name: string;
  username: string;
  initials: string;
  plan: { tier: "Premium" | "Free"; renews: string | null };
  credits: number;
};

export const mockUser: MockUser = {
  name: "Demo Reader",
  username: "demo_reader",
  initials: "DR",
  plan: { tier: "Premium", renews: "12 Nov" },
  credits: 1250,
};

export type MockNotification = { id: string; title: string; body: string; time: string };

export const mockNotifications: MockNotification[] = [
  { id: "n1", title: "New episode of ODOGWU", body: "47STUDIOS just dropped the latest chapter.", time: "2h ago" },
  { id: "n2", title: "AFRI DIVAZ was updated", body: "A series in your library has new pages.", time: "Yesterday" },
  { id: "n3", title: "Sanmi crown replied to you", body: "On AZANIA: \"Thank you! More soon.\"", time: "3d ago" },
  { id: "n4", title: "Premium renews soon", body: "Your ₦500 plan renews on 12 Nov.", time: "5d ago" },
];

let memoryValue = false;
const listeners = new Set<() => void>();

function read() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return memoryValue;
  }
}

function write(signedIn: boolean) {
  memoryValue = signedIn;
  try {
    localStorage.setItem(STORAGE_KEY, signedIn ? "1" : "0");
  } catch {
    // Storage unavailable (private mode): the in-memory value still works for this tab.
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

// A set of ids kept in localStorage (saved series, liked shorts) for the mock user.
function createIdSetStore(key: string) {
  let memory = "[]";

  const readIds = () => {
    try {
      return localStorage.getItem(key) ?? "[]";
    } catch {
      return memory;
    }
  };

  const writeIds = (ids: string[]) => {
    memory = JSON.stringify(ids);
    try {
      localStorage.setItem(key, memory);
    } catch {
      // In-memory fallback only.
    }
    listeners.forEach((listener) => listener());
  };

  return function useIdSet() {
    const ids: string[] = JSON.parse(useSyncExternalStore(subscribe, readIds, () => "[]"));
    return {
      has: (id: string) => ids.includes(id),
      toggle: (id: string) => writeIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),
    };
  };
}

export const useMockLibrary = createIdSetStore("tc-mock-library");
export const useMockLikes = createIdSetStore("tc-mock-likes");

export function useMockSession() {
  const signedIn = useSyncExternalStore(subscribe, read, () => false);

  return {
    user: signedIn ? mockUser : null,
    signIn: () => write(true),
    signOut: () => write(false),
  };
}
