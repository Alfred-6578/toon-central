"use client";

import Link from "next/link";
import { useEffect } from "react";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { cloudinary } from "@/lib/format";
import { useHydrated, useMockSession } from "@/lib/mockSession";
import { useMockNotifications } from "@/lib/notifications";
import { KIND_STYLE } from "./kinds";

// One notification, opened to be read in full. Opening it marks it read.
export function NotificationReader({ id }: { id: string }) {
  const hydrated = useHydrated();
  const { user } = useMockSession();
  const { get, markRead } = useMockNotifications();
  const note = get(id);

  useEffect(() => {
    if (note) markRead(note.id);
    // markRead is stable in effect (it only writes the same id once).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  if (!hydrated) return <div className="min-h-[50vh]" />;
  if (!user) return <SignInPrompt title="Notifications" body="Sign in to read your notifications." next={`/notifications/${id}`} />;
  if (!note) {
    return (
      <div className="border-2 border-dashed border-line px-6 py-12 text-center">
        <p className="font-display text-3xl uppercase text-white">Notification not found</p>
        <Link href="/notifications" className="btn btn-primary mt-6 px-6 py-3">All notifications</Link>
      </div>
    );
  }

  const { icon: Icon, label, color } = KIND_STYLE[note.kind];
  const celebratory = note.kind === "welcome" || note.kind === "milestone";

  return (
    <>
      <Link href="/notifications" className="flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-mint">
        <IoArrowBack /> All notifications
      </Link>

      <article className="relative mt-5 overflow-hidden border-[3px] border-black bg-panel shadow-[8px_8px_0_#000]">
        {/* Celebrations get a printed-comic burst behind the header. */}
        {celebratory && <div className={`dot-field absolute inset-x-0 top-0 h-48 opacity-60 ${note.kind === "milestone" ? "[--dot-color:var(--color-sun)]" : ""}`} aria-hidden="true" />}

        <header className="relative flex items-start gap-4 border-b-2 border-line p-5 sm:p-7">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center border-[3px] border-black text-2xl text-ink shadow-[3px_3px_0_#000] ${color} ${celebratory ? "-rotate-3" : ""}`}>
            <Icon />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
              {label} · {note.time}
            </p>
            <h1 className="mt-1 break-words font-display text-4xl uppercase leading-[0.9] text-white sm:text-5xl">{note.title}</h1>
          </div>
        </header>

        <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid content-start gap-3 text-base leading-7 text-slate-200">
            {note.message.map((paragraph, i) =>
              note.kind === "welcome" && i > 0 ? (
                <p key={i} className="flex gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black bg-mint font-display text-sm text-ink">{i}</span>
                  <span>{paragraph}</span>
                </p>
              ) : (
                <p key={i}>{paragraph}</p>
              )
            )}
            {note.cta && (
              <Link href={note.cta.href} className="btn btn-primary mt-3 w-fit gap-2 px-6 py-3 text-base">
                {note.cta.label} <IoArrowForward />
              </Link>
            )}
          </div>
          {note.art && (
            // Wrapped: the global img { display: block } rule would override `hidden` on the img itself.
            <div className="hidden md:block">
              <img src={cloudinary(note.art, 400)} alt="" className="aspect-[3/4] w-40 -rotate-2 border-[3px] border-black object-cover shadow-[5px_5px_0_#000]" />
            </div>
          )}
        </div>
      </article>
    </>
  );
}
