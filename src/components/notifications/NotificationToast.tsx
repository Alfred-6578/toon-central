"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { clearPendingNotification, NOTIFICATION_EVENT, pendingNotification, useMockNotifications, type MockNotification } from "@/lib/notifications";
import { KIND_STYLE, notificationHref } from "./kinds";

const SHOW_MS = 7000;

// Pops up when a new notification arrives (welcome, a congratulation, a new episode), wherever the
// reader is. Tap to read it in full; it also stays in the bell and /notifications.
export function NotificationToast() {
  const { markRead } = useMockNotifications();
  const [note, setNote] = useState<MockNotification | null>(null);
  const [paused, setPaused] = useState(false);
  const close = () => {
    clearPendingNotification();
    setNote(null);
  };

  useEffect(() => {
    const show = (next: MockNotification | null) => {
      if (!next) return;
      setNote(next);
      setPaused(false);
    };
    // One still waiting from the page before shows here.
    const pending = setTimeout(() => show(pendingNotification()), 0);
    const onNew = (event: Event) => show((event as CustomEvent<MockNotification>).detail);
    window.addEventListener(NOTIFICATION_EVENT, onNew);
    return () => {
      clearTimeout(pending);
      window.removeEventListener(NOTIFICATION_EVENT, onNew);
    };
  }, []);

  useEffect(() => {
    if (!note || paused) return;
    const timer = setTimeout(close, SHOW_MS);
    return () => clearTimeout(timer);
  }, [note, paused]);

  if (!note) return null;
  const { icon: Icon, label, color } = KIND_STYLE[note.kind];

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="toast-in fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[110] sm:left-auto sm:right-5 sm:top-20 sm:w-96"
    >
      <div className="relative overflow-hidden border-[3px] border-black bg-ink shadow-[6px_6px_0_#000]">
        <Link
          href={notificationHref(note.id)}
          onClick={() => {
            markRead(note.id);
            close();
          }}
          className="flex items-start gap-3 p-4 pr-10 hover:bg-panel"
        >
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black text-xl text-ink ${color} ${note.kind === "milestone" ? "-rotate-6" : ""}`}>
            <Icon />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-[0.15em] text-mint">{label}</span>
            <span className="mt-0.5 block font-display text-xl uppercase leading-tight text-white">{note.title}</span>
            <span className="mt-1 line-clamp-2 block text-sm text-slate-300">{note.body}</span>
            <span className="mt-2 block text-xs font-bold text-mint">Read →</span>
          </span>
        </Link>
        <button type="button" onClick={close} aria-label="Dismiss" className="absolute right-2 top-2 p-1.5 text-lg text-slate-400 hover:text-white">
          <IoClose />
        </button>
        {/* Time left before it tucks itself away. */}
        {!paused && <span key={note.id} className="toast-timer absolute bottom-0 left-0 h-1 bg-mint" style={{ animationDuration: `${SHOW_MS}ms` }} />}
      </div>
    </div>
  );
}
