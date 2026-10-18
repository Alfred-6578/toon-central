"use client";

import { useSyncExternalStore } from "react";
import { createIdSetStore } from "@/lib/mockSession";
import { timeAgo } from "@/lib/format";

export type NotificationKind = "welcome" | "milestone" | "episode" | "reply" | "account";

export type MockNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  // One line for the bell, the list and the pop-up.
  body: string;
  // The full message on its reading page, paragraph by paragraph.
  message: string[];
  cta: { label: string; href: string } | null;
  // A cover to show with it (new episodes).
  art: string | null;
  // ISO time for ones created in this browser; fixed labels for the sample ones.
  createdAt: string | null;
  time: string;
};

// Sample notifications that were already waiting (the API has no notifications feed yet).
const SAMPLES: MockNotification[] = [
  {
    id: "n1",
    kind: "episode",
    title: "New episode of ODOGWU",
    body: "47STUDIOS just dropped episode 7.",
    message: [
      "47STUDIOS just published episode 7 of ODOGWU, a comic in your library.",
      "Pick up where you left off, or start the new episode now.",
    ],
    cta: { label: "Read episode 7", href: "/comics/4c06eec3-c5a8-4c4c-b2e0-2aaad1478f01/read/7" },
    art: "https://res.cloudinary.com/da0ivgw2v/image/upload/v1770757007/comics/wqdwpsw3slkahpwr7zkm.jpg",
    createdAt: null,
    time: "2h ago",
  },
  {
    id: "n2",
    kind: "milestone",
    title: "3-day reading streak",
    body: "You've read something three days in a row. Keep it going!",
    message: [
      "You've opened a comic three days in a row. That's a streak!",
      "Read something today to make it four. Readers on a streak are first to hear about new episodes from the comics they follow.",
    ],
    cta: { label: "Continue reading", href: "/library?tab=history" },
    art: null,
    createdAt: null,
    time: "Yesterday",
  },
  {
    id: "n3",
    kind: "reply",
    title: "Sanmi crown replied to you",
    body: "On AZANIA: \"Thank you! More soon.\"",
    message: ["Sanmi crown replied to your comment on AZANIA:", "“Thank you! More soon.”"],
    cta: { label: "See Sanmi crown's page", href: "/creators/sanmi-crown" },
    art: null,
    createdAt: null,
    time: "3d ago",
  },
  {
    id: "n4",
    kind: "account",
    title: "Premium renews soon",
    body: "Your Premium plan renews on 12 Nov.",
    message: ["Your Premium plan renews on 12 Nov.", "You don't need to do anything. To change or cancel your plan, go to Subscription."],
    cta: { label: "Manage subscription", href: "/subscription" },
    art: null,
    createdAt: null,
    time: "5d ago",
  },
];

// Messages this browser has received (welcome, congratulations…), newest first.
const KEY = "tc-mock-notifications";
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};
const readRaw = () => {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
};
const parse = (raw: string): (MockNotification & { key?: string })[] => {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// New notifications announce themselves so the pop-up can show them, wherever the reader is.
export const NOTIFICATION_EVENT = "tc:notification";

const signedIn = () => {
  try {
    return localStorage.getItem("tc-mock-signed-in") === "1";
  } catch {
    return false;
  }
};

// Adds a notification for the signed-in reader. `key` makes it once-only (e.g. "welcome").
export function pushNotification(note: Omit<MockNotification, "id" | "createdAt" | "time">, key?: string) {
  if (!signedIn()) return;
  const all = parse(readRaw());
  if (key && all.some((n) => n.key === key)) return;
  const created = { ...note, id: `x${Date.now().toString(36)}`, createdAt: new Date().toISOString(), time: "", key };
  try {
    localStorage.setItem(KEY, JSON.stringify([created, ...all].slice(0, 50)));
  } catch {
    return;
  }
  listeners.forEach((l) => l());
  // Kept until a pop-up shows it, so a page change mid-way doesn't swallow it.
  try {
    sessionStorage.setItem(PENDING_KEY, created.id);
  } catch {
    // No session storage: the live event below still shows it on this page.
  }
  window.dispatchEvent(new CustomEvent<MockNotification>(NOTIFICATION_EVENT, { detail: created }));
}

const PENDING_KEY = "tc-notification-pending";

// The notification waiting to pop up: it waits until a pop-up has been seen through (closed, tapped
// or timed out), so moving to another page while it shows brings it back there.
export function pendingNotification(): MockNotification | null {
  try {
    const id = sessionStorage.getItem(PENDING_KEY);
    return id ? parse(readRaw()).find((n) => n.id === id) ?? null : null;
  } catch {
    return null;
  }
}

export function clearPendingNotification() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing waiting.
  }
}

export const notifyWelcome = (name?: string) =>
  pushNotification(
    {
      kind: "welcome",
      title: name ? `Welcome to Toon Central, ${name.split(" ")[0]}!` : "Welcome to Toon Central!",
      body: "Here's how to get the most out of it.",
      message: [
        "Welcome to the home of Mafiki: comics and animated shorts from creators across Africa.",
        "Start with any comic: the first 3 episodes of every one are free.",
        "Tap the bookmark on a comic to save it to your library. We'll tell you here when it gets a new episode.",
        "Swipe through Shorts for animated stories, and follow the creators you like.",
      ],
      cta: { label: "Find something to read", href: "/discover" },
      art: null,
    },
    "welcome"
  );

export const notifyFirstEpisode = (title: string, href: string) =>
  pushNotification(
    {
      kind: "milestone",
      title: "First episode done!",
      body: `You finished your first episode, of ${title}. Nice one.`,
      message: [`You just finished your first episode on Toon Central, of ${title}. Congratulations!`, "The story continues in the next episode."],
      cta: { label: "Read the next episode", href },
      art: null,
    },
    "first-episode"
  );

export const notifyFirstUnlock = () =>
  pushNotification(
    {
      kind: "milestone",
      title: "You unlocked your first page",
      body: "Thanks for supporting African creators.",
      message: ["You've unlocked your first locked page. Thank you: part of every unlock goes to the creator who made it."],
      cta: null,
      art: null,
    },
    "first-unlock"
  );

// For the client demo (/preview/loading): a fresh new-episode message on demand.
export const notifyNewEpisodeDemo = () =>
  pushNotification({
    kind: "episode",
    title: "New episode of AFRI DIVAZ",
    body: "Tooncentralofficial just published a new episode.",
    message: ["A new episode of AFRI DIVAZ, a comic in your library, is out now.", "Jump straight in, or catch up from where you left off."],
    cta: { label: "Read it now", href: "/comics/9e20eecf-14ee-4312-bf68-ea3e9f348c0f" },
    art: "https://res.cloudinary.com/da0ivgw2v/image/upload/v1782920680/comics/nneyq3dcp5qhr4f0ebp7.jpg",
  });

// Clears the once-only ones (welcome, first episode…) so the demo can show them again.
export function resetDemoNotifications() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to reset.
  }
  listeners.forEach((l) => l());
}

const useRead = createIdSetStore("tc-mock-read-notifications");

// The bell, the account sheet, the pop-up and /notifications all read from here.
export function useMockNotifications() {
  const fresh = parse(useSyncExternalStore(subscribe, readRaw, () => "[]")).map((n) => ({ ...n, time: n.createdAt ? timeAgo(n.createdAt) : n.time }));
  const items = [...fresh, ...SAMPLES];
  const read = useRead();
  const unreadIds = new Set(items.filter((n) => !read.has(n.id)).map((n) => n.id));
  return {
    items,
    unreadIds,
    get: (id: string) => items.find((n) => n.id === id) ?? null,
    markRead: (id: string) => read.addAll([id]),
    markAllRead: () => read.addAll(items.map((n) => n.id)),
  };
}
