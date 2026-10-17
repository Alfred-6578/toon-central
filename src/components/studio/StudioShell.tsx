import Link from "next/link";
import type { ReactNode } from "react";
import { IoAnalyticsOutline, IoBookOutline, IoFilmOutline, IoPersonCircleOutline, IoWalletOutline } from "react-icons/io5";
import type { IconType } from "react-icons";
import { Navigation } from "@/components/layout/Navigation";
import { STUDIO_PAGES, type StudioPageId } from "@/lib/studio";
import { ScrollIntoStrip } from "./ScrollIntoStrip";

const ICONS: Record<StudioPageId, IconType> = {
  overview: IoAnalyticsOutline,
  comics: IoBookOutline,
  shorts: IoFilmOutline,
  earnings: IoWalletOutline,
  profile: IoPersonCircleOutline,
};

type Props = {
  active: StudioPageId;
  // Carried onto sidebar links so the demo choice (?studio=…) survives moving between pages.
  query?: string;
  children: ReactNode;
};

// Creator Studio frame: site nav on top, Studio sections on the left (a sideways strip on phones).
export function StudioShell({ active, query = "", children }: Props) {
  return (
    <div className="relative min-h-screen text-white">
      <main className="relative pb-24 lg:pb-12">
        <Navigation />
        <div className="h-[66px]" />

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 pt-8 md:px-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:pt-10">
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-mint">Creator</p>
            <p className="font-display text-4xl uppercase leading-none text-white">Studio</p>

            <nav aria-label="Studio" className="hide-scrollbar -mx-6 mt-5 overflow-x-auto px-6 lg:mx-0 lg:mt-8 lg:overflow-visible lg:px-0">
              <ul className="flex w-max gap-2 lg:w-auto lg:flex-col lg:gap-1">
                {STUDIO_PAGES.map(({ id, label, href, ready }) => {
                  const Icon = ICONS[id];
                  const current = id === active;
                  const base = "flex items-center gap-3 whitespace-nowrap border-2 px-3 py-2 text-sm font-semibold";
                  return (
                    <li key={id}>
                      {ready ? (
                        <Link
                          href={`${href}${query}`}
                          aria-current={current ? "page" : undefined}
                          className={`${base} ${current ? "border-black bg-mint text-ink shadow-[3px_3px_0_#000]" : "border-transparent text-slate-300 hover:border-line hover:text-white"}`}
                        >
                          <Icon className="text-lg" /> {label}
                        </Link>
                      ) : (
                        <span className={`${base} border-transparent text-slate-600`} title="Being built next">
                          <Icon className="text-lg" /> {label}
                          <span className="ml-auto text-[10px] font-bold uppercase tracking-wide">Soon</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <ScrollIntoStrip />
            </nav>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
