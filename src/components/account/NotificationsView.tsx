"use client";

import Link from "next/link";
import { useState } from "react";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { KIND_STYLE, notificationHref } from "@/components/notifications/kinds";
import { useMockSession, useHydrated } from "@/lib/mockSession";
import { useMockNotifications } from "@/lib/notifications";


// Everything behind the bell, with an Unread filter. Read state is shared with the bell's dropdown.
export function NotificationsView() {
  const { user } = useMockSession();
  const { items, unreadIds, markRead, markAllRead } = useMockNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const hydrated = useHydrated();
  if (!hydrated) return <div className="min-h-[50vh]" />;

  if (!user) {
    return (
      <SignInPrompt
        title="Your notifications"
        body="Sign in to hear when comics in your library get new episodes and when creators reply to you."
        next="/notifications"
      />
    );
  }

  const shown = filter === "unread" ? items.filter((n) => unreadIds.has(n.id)) : items;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex border-2 border-line" role="group" aria-label="Show">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`px-4 py-1.5 text-sm font-semibold ${filter === value ? "bg-mint text-ink" : "text-slate-300 hover:text-white"}`}
            >
              {value === "all" ? `All ${items.length}` : `Unread ${unreadIds.size}`}
            </button>
          ))}
        </div>
        {unreadIds.size > 0 && (
          <button type="button" onClick={markAllRead} className="text-sm font-semibold text-mint underline-offset-4 hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="border-2 border-dashed border-line px-6 py-10 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
      ) : (
        <ul className="border-2 border-line">
          {shown.map((item) => {
            const { icon: Icon, color } = KIND_STYLE[item.kind];
            const unread = unreadIds.has(item.id);
            return (
              <li key={item.id} className="border-b-2 border-line last:border-b-0">
                <Link
                  href={notificationHref(item.id)}
                  onClick={() => markRead(item.id)}
                  className={`flex items-start gap-4 px-4 py-4 transition-colors hover:bg-panel sm:px-5 ${unread ? "bg-panel/60" : ""}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 text-lg ${
                      unread ? `border-black ${color} text-ink` : "border-line text-slate-400"
                    }`}
                  >
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${unread ? "font-bold text-white" : "font-semibold text-slate-200"}`}>{item.title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-400">{item.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-slate-500">{item.time}</span>
                    {unread && <span className="h-2.5 w-2.5 bg-mint" aria-label="Unread" />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-slate-500">
        Choose what you&apos;re notified about in <Link href="/settings#notifications" className="text-slate-300 underline-offset-4 hover:underline">Settings</Link>.
      </p>
    </>
  );
}
