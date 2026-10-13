"use client";

import { useSyncExternalStore } from "react";
import { SESSION_COOKIE } from "./session";

// Stand-in for real auth: "Sign in" / "Join now" flip this on, "Sign out" flips it off.
// Persisted in localStorage so a refresh keeps the state. Swap for the real session later.
const STORAGE_KEY = "tc-mock-signed-in";

export type MockUser = {
  name: string;
  username: string;
  initials: string;
  bio: string;
  email: string;
  joined: string;
  plan: { tier: "Premium" | "Free"; renews: string | null };
  credits: number;
  followers: number;
  // Friends who joined with this reader's referral link.
  referrals: number;
};

export const mockUser: MockUser = {
  name: "Demo Reader",
  username: "demo_reader",
  initials: "DR",
  bio: "",
  email: "reader@example.com",
  joined: "2025-03-14",
  plan: { tier: "Premium", renews: "12 Nov" },
  credits: 1250,
  followers: 24,
  referrals: 2,
};

export type MockNotification = {
  id: string;
  kind: "episode" | "reply" | "account";
  title: string;
  body: string;
  time: string;
  href: string;
};

export const mockNotifications: MockNotification[] = [
  { id: "n1", kind: "episode", title: "New episode of ODOGWU", body: "47STUDIOS just dropped the latest chapter.", time: "2h ago", href: "/comics/4c06eec3-c5a8-4c4c-b2e0-2aaad1478f01" },
  { id: "n2", kind: "episode", title: "AFRI DIVAZ was updated", body: "A comic in your library has new pages.", time: "Yesterday", href: "/comics/9e20eecf-14ee-4312-bf68-ea3e9f348c0f" },
  { id: "n3", kind: "reply", title: "Sanmi crown replied to you", body: "On AZANIA: \"Thank you! More soon.\"", time: "3d ago", href: "/creators/sanmi-crown" },
  { id: "n4", kind: "account", title: "Premium renews soon", body: "Your ₦500 plan renews on 12 Nov.", time: "5d ago", href: "/subscription" },
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

// Mirrored into a cookie so server-rendered pages (the reader) can see the mock session.
export function writeSessionCookie(signedIn: boolean) {
  document.cookie = `${SESSION_COOKIE}=${signedIn ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
}

function write(signedIn: boolean) {
  memoryValue = signedIn;
  try {
    localStorage.setItem(STORAGE_KEY, signedIn ? "1" : "0");
  } catch {
    // Storage unavailable (private mode): the in-memory value still works for this tab.
  }
  writeSessionCookie(signedIn);
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

// A set of ids kept in localStorage (saved comics, liked shorts) for the mock user.
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
      // In the order they were added, oldest first.
      ids,
      has: (id: string) => ids.includes(id),
      addAll: (more: string[]) => writeIds([...new Set([...ids, ...more])]),
      toggle: (id: string) => writeIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),
    };
  };
}

export const useMockLibrary = createIdSetStore("tc-mock-library");
export const useMockLikes = createIdSetStore("tc-mock-likes");
export const useMockFollows = createIdSetStore("tc-mock-follows");
export const useMockSavedShorts = createIdSetStore("tc-mock-saved-shorts");
const useReadNotifications = createIdSetStore("tc-mock-read-notifications");

// The bell, the account sheet and /notifications share which notifications have been read.
export function useMockNotifications() {
  const read = useReadNotifications();
  const unreadIds = new Set(mockNotifications.filter((n) => !read.has(n.id)).map((n) => n.id));
  return {
    items: mockNotifications,
    unreadIds,
    markRead: (id: string) => read.addAll([id]),
    markAllRead: () => read.addAll(mockNotifications.map((n) => n.id)),
  };
}

// Edits from /settings, laid over the mock user (name, username, bio).
const PROFILE_KEY = "tc-mock-profile";
let memoryProfile = "{}";

function readProfile() {
  try {
    return localStorage.getItem(PROFILE_KEY) ?? "{}";
  } catch {
    return memoryProfile;
  }
}

export type ProfileEdits = Partial<Pick<MockUser, "name" | "username" | "bio" | "email">>;

export function updateProfile(edits: ProfileEdits) {
  memoryProfile = JSON.stringify({ ...JSON.parse(readProfile()), ...edits });
  try {
    localStorage.setItem(PROFILE_KEY, memoryProfile);
  } catch {
    // In-memory fallback only.
  }
  listeners.forEach((listener) => listener());
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "?";

export type MockComment = { id: string; text: string; at: string };

// Comments the mock user has posted, per short. There's no comments data in the API snapshot, so
// these are the only comments the preview can show, and they live only in this browser.
const COMMENTS_KEY = "tc-mock-comments";
let memoryComments = "{}";

function readComments() {
  try {
    return localStorage.getItem(COMMENTS_KEY) ?? "{}";
  } catch {
    return memoryComments;
  }
}

export function useMockComments(shortId: string) {
  const all: Record<string, MockComment[]> = JSON.parse(useSyncExternalStore(subscribe, readComments, () => "{}"));
  const comments = all[shortId] ?? [];

  return {
    comments,
    add: (text: string) => {
      const next = { ...all, [shortId]: [{ id: `${Date.now()}`, text, at: new Date().toISOString() }, ...comments] };
      memoryComments = JSON.stringify(next);
      try {
        localStorage.setItem(COMMENTS_KEY, memoryComments);
      } catch {
        // In-memory fallback only.
      }
      listeners.forEach((listener) => listener());
    },
  };
}

export function useMockSession() {
  const signedIn = useSyncExternalStore(subscribe, read, () => false);
  const edits: ProfileEdits = JSON.parse(useSyncExternalStore(subscribe, readProfile, () => "{}"));
  const user = { ...mockUser, ...edits };
  user.initials = initialsOf(user.name);

  return {
    user: signedIn ? user : null,
    signIn: () => write(true),
    signOut: () => write(false),
  };
}

const noopSubscribe = () => () => {};

// False on the server and during hydration, true after. Account pages wait for it so a signed-in
// reader doesn't see a "Sign in" panel flash before their session is read from this browser.
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
