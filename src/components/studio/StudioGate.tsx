"use client";

import type { ReactNode } from "react";
import { IoCloudOfflineOutline, IoDesktopOutline } from "react-icons/io5";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { useMockCreator } from "@/lib/mockCreator";
import { useHydrated, useMockSession } from "@/lib/mockSession";
import type { StudioMode } from "@/lib/studioModel";
import { BecomeCreator } from "./BecomeCreator";

// Who gets into a Studio page: signed out → sign in (and back here); signed in but not a creator →
// the one-step setup; creators, or the "established" demo → the page. In mode "live" anyone whose
// account already has Mafiki or shorts (`hasItems`) skips the setup; `unreadable`: the backend didn't
// answer, so there's nothing to show.
type GateProps = { mode: StudioMode; next: string; hasItems?: boolean; unreadable?: boolean; children: ReactNode };

export function StudioGate({ mode, next, hasItems = false, unreadable = false, children }: GateProps) {
  const hydrated = useHydrated();
  const { user } = useMockSession();
  const { profile } = useMockCreator();

  if (!hydrated) return <div className="min-h-[50vh]" />;
  if (!user) {
    return <SignInPrompt title="Creator Studio" body="Sign in to publish your Mafiki and shorts and see how readers respond." next={next} />;
  }
  if (unreadable) return <StudioUnreadable />;
  if (mode !== "established" && !profile && !(mode === "live" && hasItems)) return <BecomeCreator />;
  return <>{children}</>;
}

export function StudioUnreadable() {
  return (
    <div className="flex flex-col items-center gap-3 border-2 border-dashed border-line px-6 py-12 text-center">
      <IoCloudOfflineOutline className="text-4xl text-slate-400" />
      <p className="font-display text-3xl uppercase text-white">Couldn&apos;t load your Studio</p>
      <p className="max-w-md text-sm text-slate-400">Your Mafiki and shorts didn&apos;t come through. Refresh the page to try again.</p>
    </div>
  );
}

// Editing and uploading are desktop-only; phones get a note instead of the form.
export function DesktopOnly({ children, what = "edit" }: { children: ReactNode; what?: string }) {
  return (
    <>
      <div className="flex items-start gap-3 border-2 border-dashed border-line px-4 py-5 text-sm leading-6 text-slate-300 lg:hidden">
        <IoDesktopOutline className="mt-0.5 shrink-0 text-xl text-mint" />
        <p>Open Studio on a computer to {what}. Everything you publish shows up here on your phone too.</p>
      </div>
      <div className="hidden lg:block">{children}</div>
    </>
  );
}

export function SampleStamp() {
  return <span className="border border-dashed border-current px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide opacity-70">Sample</span>;
}
