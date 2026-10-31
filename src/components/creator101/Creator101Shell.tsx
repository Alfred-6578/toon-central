import Link from "next/link";
import type { ReactNode } from "react";
import { Footer, type FooterStats } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { authHref } from "@/lib/auth";

export const CREATOR101_TABS = [
  { href: "/creator101", label: "Introduction", id: "intro" },
  { href: "/creator101/uploading", label: "Uploading", id: "uploading" },
  { href: "/creator101/mafiki", label: "Mafiki", id: "mafiki" },
  { href: "/creator101/making-money", label: "Making money", id: "money" },
] as const;

export type Creator101Tab = (typeof CREATOR101_TABS)[number]["id"];

export const PUBLISH_HREF = "/creator/comics/new";

// Creator 101, the creators' guide (as on the live site): four tabs, each its own URL, sharing this
// tab strip and the "start creating" sign-off.
type ShellProps = {
  tab: Creator101Tab;
  stats: FooterStats;
  // The "start creating" sign-off; off for a tab that ends on its own call to action.
  signOff?: boolean;
  children: ReactNode;
};

export function Creator101Shell({ tab, stats, signOff = true, children }: ShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />

        <nav aria-label="Creator 101" className="hide-scrollbar sticky top-[66px] z-30 overflow-x-auto border-b-2 border-line bg-ink/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl justify-between px-4 sm:justify-start sm:gap-1 sm:px-6 md:px-8 lg:px-10">
            {CREATOR101_TABS.map(({ href, label, id }) => {
              const active = id === tab;
              return (
                <Link
                  key={id}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative shrink-0 px-1.5 py-3.5 text-[11px] font-bold uppercase tracking-[0.03em] transition-colors sm:px-3 sm:text-sm sm:tracking-[0.08em] ${
                    active ? "text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                  {active && <span className="absolute inset-x-1.5 bottom-0 h-1 bg-mint sm:inset-x-3" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {children}

        {signOff && <StartCreating />}
        <Footer stats={stats} />
      </main>
    </div>
  );
}

// The sign-off every tab ends on, as on the live site: two steps and the two ways in.
function StartCreating() {
  return (
    <section className="border-t-2 border-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-10">
        <div>
          <h2 className="font-display text-4xl uppercase leading-[0.95] text-white sm:text-5xl">Start creating with Toon Central today</h2>
          <p className="mt-3 text-slate-300">Got a story to tell? Two steps and it&apos;s out there.</p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {["Create a free Toon Central account", "Tap Publish and upload your first episode"].map((step, i) => (
              <li key={step} className="flex items-center gap-3 border-2 border-line bg-panel px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-mint font-display text-lg text-ink">{i + 1}</span>
                <span className="text-sm font-semibold text-slate-200">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={PUBLISH_HREF} className="btn btn-primary px-6 py-3 text-base">Start publishing</Link>
          <Link href={authHref("signup", "/creator101")} className="btn btn-ghost px-6 py-3 text-base">Create account</Link>
        </div>
      </div>
    </section>
  );
}

// Section heading used across the tabs: big display type, optional mint highlight word.
export function SectionTitle({ children, highlight, className = "" }: { children: ReactNode; highlight?: string; className?: string }) {
  return (
    <h2 className={`font-display text-4xl uppercase leading-[0.95] text-white sm:text-5xl ${className}`}>
      {children}
      {highlight && (
        <>
          {" "}
          <span className="inline-block -rotate-2 bg-mint px-2 text-ink">{highlight}</span>
        </>
      )}
    </h2>
  );
}

// A numbered requirement card (Making money's steps and "to qualify" lists).
export function StepCard({ n, title, children }: { n: number; title?: string; children: ReactNode }) {
  return (
    <li className="relative border-2 border-line bg-panel p-5 pt-7">
      <span className="absolute -top-4 left-5 flex h-9 w-9 items-center justify-center border-2 border-black bg-mint font-display text-xl text-ink shadow-[2px_2px_0_#000]">
        {n}
      </span>
      {title && <h3 className="font-bold text-white">{title}</h3>}
      <div className={`text-sm leading-6 text-slate-300 ${title ? "mt-1.5" : ""}`}>{children}</div>
    </li>
  );
}
