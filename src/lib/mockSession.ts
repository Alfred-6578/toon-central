"use client";

import { createContext, createElement, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { addToFavouritesAction, followStatusAction, readerListsAction, setFollowAction, setLikeAction } from "@/app/actions/reader";
import { authHref } from "./auth";
import { SESSION_COOKIE, SIGNED_IN_HINT } from "./session";

// The signed-in reader. With accounts live (TOON_API_LIVE has "accounts") it's the real account, read
// from our server (/api/session); otherwise it's the stand-in below: "Sign in" / "Join now" flip it
// on, "Sign out" flips it off, persisted in localStorage so a refresh keeps the state.
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
  // Friends who joined with this reader's referral link, newest first. Sample: the API has no
  // referral data yet.
  referrals: { name: string; joined: string }[];
  photo?: string | null;
  // Real accounts only: the editable profile fields as the API keeps them.
  firstName?: string;
  lastName?: string;
  phone?: string;
  operatorId?: number;
  // YYYY-MM-DD; the API needs it on every profile save.
  dob?: string | null;
  // What the reader's invite link carries, so sign-ups are credited to them.
  referralCode?: string | null;
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
  referrals: [
    { name: "Chiamaka Obi", joined: "2026-10-17" },
    { name: "Tunde Bakare", joined: "2026-10-09" },
    { name: "Amara Nwosu", joined: "2026-10-02" },
    { name: "Kwame Mensah", joined: "2026-09-21" },
    { name: "Zainab Bello", joined: "2026-09-04" },
    { name: "Ifeoma Eze", joined: "2026-08-15" },
    { name: "Seun Adeyemi", joined: "2026-07-28" },
  ],
};



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

const memoryKeys = new Map<string, string>();

function readKey(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return memoryKeys.get(key) ?? fallback;
  }
}

function writeKey(key: string, value: string) {
  memoryKeys.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // In-memory fallback only.
  }
  listeners.forEach((listener) => listener());
}

const readList = (key: string): string[] => JSON.parse(readKey(key, "[]"));

// With reader actions live (TOON_API_LIVE has "readerActions"), a store follows the signed-in reader's
// account instead of the mock user. Its ids are kept under "<key>:live" (cleared on sign-out) so the
// page shows the last known state straight away while the backend is asked.
type LiveSync = {
  // The reader's ids as the backend has them, or null when it couldn't say. Stores without one
  // start from what this browser last knew (the backend has no list for them).
  load?: () => Promise<string[] | null>;
  // Turns one id on or off. Resolves to the state the backend ended in, or null when the call failed.
  // `ref` is whatever else the call needs (a creator's user id, for follows).
  set: (id: string, on: boolean, ref?: number) => Promise<boolean | null>;
};

const liveKeys = new Set<string>();

// A set of ids kept in localStorage (saved comics, liked shorts) for the mock user, or for the real
// reader when `sync` is given and reader actions are live.
export function createIdSetStore(key: string, sync?: LiveSync) {
  const liveKey = `${key}:live`;
  let loading = false;
  // What the backend's list said when it loaded (public counts already include these).
  let loaded: string[] | null = null;
  // Taps made in this page load. The list can arrive after them, and must not undo them.
  const tapped = new Map<string, boolean>();
  if (sync) liveKeys.add(liveKey);

  return function useIdSet() {
    const mode = useReaderActionsMode();
    const live = mode !== "mock" && sync ? mode : null;
    const storeKey = live ? liveKey : key;
    // Signed out with live actions there's nothing to show: the buttons send the reader to sign in.
    const ids: string[] = JSON.parse(useSyncExternalStore(subscribe, () => (live === "signed-out" ? "[]" : readKey(storeKey, "[]")), () => "[]"));

    useEffect(() => {
      if (live !== "signed-in" || !sync?.load || loading) return;
      loading = true;
      sync.load().then((fresh) => {
        if (!fresh) {
          loading = false;
          return;
        }
        loaded = fresh;
        const kept = fresh.filter((id) => tapped.get(id) !== false);
        const added = [...tapped].filter(([id, on]) => on && !kept.includes(id)).map(([id]) => id);
        writeKey(liveKey, JSON.stringify([...kept, ...added]));
      });
    }, [live]);

    const setOne = (id: string, on: boolean, inKey = storeKey) => {
      const rest = readList(inKey).filter((x) => x !== id);
      writeKey(inKey, JSON.stringify(on ? [...rest, id] : rest));
    };

    const toggleLive = (id: string, ref?: number) => {
      const on = !readList(liveKey).includes(id);
      setOne(id, on, liveKey);
      tapped.set(id, on);
      // Shown straight away; put back if the backend ends up somewhere else.
      sync!.set(id, on, ref).then((state) => {
        if ((state ?? !on) === on) return;
        setOne(id, !on, liveKey);
        tapped.set(id, !on);
      });
    };

    const toggle = (id: string, ref?: number) => {
      if (!live) return setOne(id, !readList(key).includes(id));
      if (live === "signed-in") return toggleLive(id, ref);
      // Tapped before the session loaded: do it once we know the reader is signed in.
      if (realSession.status !== "ready") {
        loadSession().then(() => {
          if (realSession.user) toggleLive(id, ref);
        });
      }
    };

    return {
      // In the order they were added, oldest first.
      ids,
      has: (id: string) => ids.includes(id),
      // Whether the backend already counted this id when the page loaded (false in mock mode).
      counted: (id: string) => live === "signed-in" && loaded !== null && loaded.includes(id),
      addAll: (more: string[]) => more.filter((id) => !ids.includes(id)).forEach((id) => toggle(id)),
      toggle,
      // Records what the backend said without asking it to change anything.
      // A tap made in this page load wins: the backend's answer may predate it.
      confirm: (id: string, on: boolean) => {
        if (live === "signed-in" && !tapped.has(id) && readList(liveKey).includes(id) !== on) setOne(id, on);
      },
    };
  };
}

// Liked comics and the library both come from one pair of requests, made once per page load.
let readerLists: ReturnType<typeof readerListsAction> | null = null;
const loadReaderLists = () => {
  readerLists ??= readerListsAction().then((lists) => {
    if (!lists) readerLists = null;
    return lists;
  });
  return readerLists;
};

// The backend can add a comic to the library but not take one out, so removals are kept here and
// hidden from the backend's list. Saving it again takes it off this list.
const LIBRARY_HIDDEN = "tc-library-hidden:live";
liveKeys.add(LIBRARY_HIDDEN);

export const useMockLibrary = createIdSetStore("tc-mock-library", {
  load: async () => {
    const lists = await loadReaderLists();
    const hidden = readList(LIBRARY_HIDDEN);
    return lists && lists.favourites.filter((id) => !hidden.includes(id));
  },
  set: async (id, on) => {
    const hidden = readList(LIBRARY_HIDDEN).filter((x) => x !== id);
    writeKey(LIBRARY_HIDDEN, JSON.stringify(on ? hidden : [...hidden, id]));
    if (!on) return false;
    return (await addToFavouritesAction(id)).ok ? true : null;
  },
});

const likeSync = (kind: "comics" | "shorts"): LiveSync => ({
  set: async (id, on) => {
    const result = await setLikeAction(kind, id, on);
    return result.ok ? result.value : null;
  },
});

// Liked shorts. The backend has no list of them, so this browser remembers which ones it liked.
export const useMockLikes = createIdSetStore("tc-mock-likes", likeSync("shorts"));
export const useMockComicLikes = createIdSetStore("tc-mock-comic-likes", {
  ...likeSync("comics"),
  load: async () => (await loadReaderLists())?.likedComics ?? null,
});
// Comics the reader subscribed to: told when a new episode drops (separate from saving to the library).
// Stays in the browser even with live reader actions: the backend's subscribe fails (see readerActions.ts).
export const useMockSubscriptions = createIdSetStore("tc-mock-subscriptions");
// Keyed by username; following on the backend needs the creator's user id, passed as toggle's `ref`.
// There's no list of who a reader follows, so each Follow button checks its creator (useFollowCheck).
export const useMockFollows = createIdSetStore("tc-mock-follows", {
  set: async (_username, on, creatorId) => {
    if (!creatorId) return null;
    const result = await setFollowAction(creatorId, on);
    return result.ok ? result.value : null;
  },
});
export const useMockSavedShorts = createIdSetStore("tc-mock-saved-shorts");

const followChecks = new Map<number, Promise<boolean | null>>();

// Asks the backend whether the reader follows this creator (once per creator per page load) and
// corrects the Follow button if this browser had it wrong.
export function useFollowCheck(username: string, creatorId: number | undefined, enabled = true) {
  const live = useReaderActionsMode() === "signed-in";
  const { confirm } = useMockFollows();
  useEffect(() => {
    if (!live || !enabled || !creatorId) return;
    if (!followChecks.has(creatorId)) followChecks.set(creatorId, followStatusAction(creatorId));
    followChecks.get(creatorId)!.then((following) => {
      if (following !== null) confirm(username, following);
    });
    // confirm is rebuilt every render; the check only depends on who and whether.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, enabled, creatorId, username]);
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

// Credits the mock reader has spent (unlocking pages), taken off their starting balance.
const SPENT_KEY = "tc-mock-credits-spent";

function readSpent() {
  try {
    return localStorage.getItem(SPENT_KEY) ?? "0";
  } catch {
    return "0";
  }
}

export function spendCredits(amount: number) {
  try {
    localStorage.setItem(SPENT_KEY, String(Number(readSpent()) + amount));
  } catch {
    // Storage unavailable: the unlock still goes through, the balance just doesn't drop.
  }
  listeners.forEach((listener) => listener());
}

// Whether accounts (and reader actions) are live, set once by the root layout (the setting is server-side).
const AccountsLiveContext = createContext({ live: false, readerActions: false });

export function AccountsProvider({ live, readerActions, children }: { live: boolean; readerActions: boolean; children: ReactNode }) {
  return createElement(AccountsLiveContext.Provider, { value: { live, readerActions: live && readerActions } }, children);
}

// The real session, fetched once per page load and again after signing in or out.
// `pending`: the hint cookie says a session exists but who it is hasn't arrived yet (and there was no
// cached copy to show), so pages show neither the reader nor "Sign in".
type RealSession = { status: "idle" | "loading" | "ready"; user: MockUser | null; pending?: boolean };
const IDLE: RealSession = { status: "idle", user: null };
let realSession = IDLE;

function setRealSession(next: RealSession) {
  realSession = next;
  listeners.forEach((listener) => listener());
}

// Forgets the live reader-action state kept in this browser (likes, library, follows).
function clearLiveState() {
  liveKeys.forEach((key) => {
    memoryKeys.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {
      // In-memory only.
    }
  });
}

// Whose live state this browser is holding, so a different account never sees the last one's.
const LIVE_OWNER_KEY = "tc-live-owner";

// The signed-in reader as last loaded, shown straight away on the next page while /api/session asks
// the backend again (that takes seconds). Only used while the hint cookie says the session is still
// there. Phone and date of birth are left out; nothing here is more than the page could fetch anyway.
const USER_CACHE_KEY = "tc-live-user";

const hasSessionHint = () => document.cookie.split("; ").includes(`${SIGNED_IN_HINT}=1`);

function cachedUser(): MockUser | null {
  try {
    return JSON.parse(readKey(USER_CACHE_KEY, "null"));
  } catch {
    return null;
  }
}

function cacheUser(user: MockUser | null) {
  if (!user) {
    memoryKeys.delete(USER_CACHE_KEY);
    try {
      localStorage.removeItem(USER_CACHE_KEY);
    } catch {
      // In-memory only.
    }
    return;
  }
  const shown = { ...user, phone: undefined, dob: undefined };
  memoryKeys.set(USER_CACHE_KEY, JSON.stringify(shown));
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(shown));
  } catch {
    // In-memory only.
  }
}

let sessionRequest: Promise<void> | null = null;

export function loadSession(force = false) {
  if (!force && realSession.status !== "idle") return sessionRequest ?? Promise.resolve();
  // A refresh (after saving settings, say) keeps showing the current reader until the new one arrives,
  // so pages waiting on the session don't blank out and lose their state. A first load shows the
  // cached reader, if the session is still there.
  if (realSession.status === "idle") {
    const hinted = hasSessionHint();
    const cached = hinted ? cachedUser() : null;
    if (!hinted) cacheUser(null);
    setRealSession({ status: "loading", user: cached, pending: hinted && !cached });
  }
  sessionRequest = fetch("/api/session", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : { user: null, unavailable: true }))
    .then((data: { user?: MockUser | null; unavailable?: boolean }) => {
      // The backend didn't answer: keep showing the cached reader rather than signing them out.
      if (data.unavailable) {
        setRealSession({ status: "ready", user: realSession.user });
        return;
      }
      const owner = data.user?.username ?? "";
      if (readKey(LIVE_OWNER_KEY, "") !== owner) {
        clearLiveState();
        writeKey(LIVE_OWNER_KEY, owner);
      }
      cacheUser(data.user ?? null);
      if (!data.user) document.documentElement.removeAttribute("data-session-hint");
      setRealSession({ status: "ready", user: data.user ?? null });
    })
    .catch(() => setRealSession({ status: "ready", user: realSession.user }));
  return sessionRequest;
}

function useRealSession() {
  const { live } = useContext(AccountsLiveContext);
  const session = useSyncExternalStore(subscribe, () => realSession, () => IDLE);
  useEffect(() => {
    if (live) loadSession();
  }, [live]);
  return { live, session };
}

// "mock": reader actions stay in this browser. Otherwise they go to the backend, for the signed-in reader.
function useReaderActionsMode(): "mock" | "signed-in" | "signed-out" {
  const { readerActions } = useContext(AccountsLiveContext);
  const { session } = useRealSession();
  if (!readerActions) return "mock";
  return session.user ? "signed-in" : "signed-out";
}

export const useReaderActionsLive = () => useContext(AccountsLiveContext).readerActions;

// Signed-out readers who like, follow or save are sent to sign in, then brought back here. While the
// session is still loading, it waits to find out first instead of sending a signed-in reader away.
const goToSignIn = async () => {
  if (realSession.status !== "ready") await loadSession();
  if (realSession.user) return;
  window.location.assign(authHref("signin", window.location.pathname + window.location.search));
};

async function signOutLive() {
  await fetch("/api/session", { method: "DELETE" }).catch(() => null);
  clearLiveState();
  cacheUser(null);
  document.documentElement.removeAttribute("data-session-hint");
  setRealSession({ status: "ready", user: null });
  // Server-rendered pages (the reader) were built for the signed-in reader.
  window.location.reload();
}

export function useMockSession() {
  const { live, session } = useRealSession();
  const signedIn = useSyncExternalStore(subscribe, read, () => false);
  const edits: ProfileEdits = JSON.parse(useSyncExternalStore(subscribe, readProfile, () => "{}"));
  const spent = Number(useSyncExternalStore(subscribe, readSpent, () => "0")) || 0;

  if (live) {
    // Credits spent on (still mock) unlocks come off the real balance until Phase 4.
    const user = session.user && { ...session.user, credits: Math.max(0, session.user.credits - spent) };
    return { user, pending: session.pending === true && session.status !== "ready", signIn: goToSignIn, signOut: signOutLive };
  }

  const user = { ...mockUser, ...edits, credits: Math.max(0, mockUser.credits - spent) };
  user.initials = initialsOf(user.name);

  return {
    user: signedIn ? user : null,
    pending: false,
    signIn: () => write(true),
    signOut: () => write(false),
  };
}

const noopSubscribe = () => () => {};

// False on the server and during hydration, true after (and, with live accounts, once the session has
// loaded). Account pages wait for it so a signed-in reader doesn't see a "Sign in" panel flash first.
export function useHydrated() {
  const { live, session } = useRealSession();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return hydrated && (!live || session.status === "ready");
}
