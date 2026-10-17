"use client";

import type { ReactNode } from "react";
import { IoDesktopOutline } from "react-icons/io5";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { useMockCreator } from "@/lib/mockCreator";
import { useHydrated, useMockSession } from "@/lib/mockSession";
import type { StudioMode } from "@/lib/studioModel";
import { BecomeCreator } from "./BecomeCreator";

// Who gets into a Studio page: signed out → sign in (and back here); signed in but not a creator →
// the one-step setup; creators, or the "established" demo → the page.
export function StudioGate({ mode, next, children }: { mode: StudioMode; next: string; children: ReactNode }) {
  const hydrated = useHydrated();
  const { user } = useMockSession();
  const { profile } = useMockCreator();

  if (!hydrated) return <div className="min-h-[50vh]" />;
  if (!user) {
    return <SignInPrompt title="Creator Studio" body="Sign in to publish your comics and shorts and see how readers respond." next={next} />;
  }
  if (mode === "new" && !profile) return <BecomeCreator />;
  return <>{children}</>;
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
