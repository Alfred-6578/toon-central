import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { Navigation } from "@/components/layout/Navigation";
import { getCatalogue } from "@/lib/api/client";
import { safeNext, USERNAME_PATTERN, type AuthMode } from "@/lib/auth";

const PAGES: Record<AuthMode, { title: string; bubble: string }> = {
  signin: { title: "Sign in", bubble: "Your story's waiting where you left it!" },
  signup: { title: "Join", bubble: "Welcome to the home of Mafiki!" },
  forgot: { title: "Reset password", bubble: "Happens to the best heroes." },
};

const isMode = (value: string): value is AuthMode => value in PAGES;

export async function generateMetadata({ params }: PageProps<"/auth/[mode]">): Promise<Metadata> {
  const { mode } = await params;
  if (!isMode(mode)) return {};
  return { title: `${PAGES[mode].title} | Toon Central`, robots: { index: mode === "signup" } };
}

// /auth/signin, /auth/signup (the live site's join URL) and /auth/forgot. ?next= is where to return to.
export default async function AuthPage({ params, searchParams }: PageProps<"/auth/[mode]">) {
  const [{ mode }, query] = await Promise.all([params, searchParams]);
  if (!isMode(mode)) notFound();

  const next = safeNext(Array.isArray(query.next) ? query.next[0] : query.next);
  // Referral links: /auth/signup?ref=username. Only a well-formed username is shown back.
  const rawRef = Array.isArray(query.ref) ? query.ref[0] : query.ref;
  const referrer = mode === "signup" && rawRef && USERNAME_PATTERN.test(rawRef) ? rawRef : null;
  // The art side: the four most-read covers.
  const covers = [...(await getCatalogue())].sort((a, b) => b.views - a.views).slice(0, 4);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />
        <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-80" />
        <div className="relative">
          <AuthShell covers={covers} bubble={PAGES[mode].bubble}>
            <AuthForm mode={mode} next={next} referrer={referrer} />
          </AuthShell>
        </div>
      </main>
    </div>
  );
}
