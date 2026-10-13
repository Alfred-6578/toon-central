import Link from "next/link";
import type { ReactNode } from "react";
import { Footer, type FooterStats } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";

const TABS = [
  { href: "/new", label: "Most read", id: "top" },
  { href: "/new/latest", label: "Latest", id: "latest" },
] as const;

type Props = {
  tab: (typeof TABS)[number]["id"];
  lede: string;
  // The tab's own filters, shown on the right of the header.
  controls?: ReactNode;
  stats: FooterStats;
  children: ReactNode;
};

// New & Popular: two independent tabs (/new = Most read, /new/latest) sharing only this header. Each tab has its
// own URL, filters and pagination, and only the active one is loaded.
export function NewAndPopularShell({ tab, lede, controls, stats, children }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-80" />
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />

        <div className="relative mx-auto px-6 pb-16 pt-10 md:px-8 lg:px-10 lg:pt-12">
          <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-7xl">New &amp; Popular</h1>

          <nav aria-label="New and popular" className="mt-8 flex gap-2 border-b-2 border-line">
            {TABS.map(({ href, label, id }) => {
              const active = id === tab;
              return (
                <Link
                  key={id}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-0.5 border-2 px-4 py-2.5 font-display text-2xl uppercase leading-none sm:text-3xl ${
                    active ? "border-line border-b-ink bg-ink text-white" : "border-transparent text-slate-500 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-300">{lede}</p>
            {controls}
          </div>

          <div className="mt-8">{children}</div>
        </div>

        <Footer stats={stats} />
      </main>
    </div>
  );
}

// Segmented filter used by both tabs.
export function FilterGroup<T extends string>({
  options,
  current,
  hrefFor,
  counts,
}: {
  options: readonly { value: T; label: string }[];
  current: T;
  hrefFor: (value: T) => string;
  counts: Record<T, number>;
}) {
  return (
    <div className="flex border-2 border-line" role="group" aria-label="Show">
      {options.map(({ value, label }) => {
        const active = current === value;
        return (
          <Link
            key={value}
            href={hrefFor(value)}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={`px-3.5 py-1.5 text-sm font-semibold ${active ? "bg-mint text-ink" : "text-slate-300 hover:text-white"}`}
          >
            {label} <span className={active ? "text-ink/60" : "text-slate-500"}>{counts[value]}</span>
          </Link>
        );
      })}
    </div>
  );
}
