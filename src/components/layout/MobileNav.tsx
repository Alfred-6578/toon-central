"use client";

import { IoCompassOutline, IoHomeOutline, IoPersonOutline, IoPlayCircleOutline, IoSearch } from "react-icons/io5";
import Link from "next/link";
import type { MockUser } from "@/lib/mockSession";
import { Avatar } from "./nav/Menus";

// Publishing is desktop-only, so the phone tab bar has no Publish tab.
export type MobileSheet = "account" | null;

type MobileNavProps = {
  user: MockUser | null;
  activeSection: string;
  sheet: MobileSheet;
  onOpenSearch: () => void;
  onOpenSheet: (sheet: Exclude<MobileSheet, null>) => void;
};

const tab = "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1 pb-1.5 pt-2 text-xs font-semibold";
const tabState = (active: boolean) => (active ? "border-mint text-mint" : "border-transparent text-slate-400");

export function MobileNav({ user, activeSection, sheet, onOpenSearch, onOpenSheet }: MobileNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-line bg-ink px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-xl items-stretch">
        <Link href="/" className={`${tab} ${tabState(activeSection === "home" && !sheet)}`}>
          <IoHomeOutline className="text-2xl" />
          Home
        </Link>
        <Link href="/shorts" className={`${tab} ${tabState(activeSection === "shorts" && !sheet)}`}>
          <IoPlayCircleOutline className="text-2xl" />
          Shorts
        </Link>
        <button type="button" onClick={onOpenSearch} className={`${tab} ${tabState(false)}`}>
          <IoSearch className="text-2xl" />
          Search
        </button>
        {/* Genre pages count as discovering on phones, where Genres has no tab of its own */}
        <Link href="/discover" className={`${tab} ${tabState((activeSection === "discover" || activeSection === "genres") && !sheet)}`}>
          <IoCompassOutline className="text-2xl" />
          Discover
        </Link>
        <button type="button" onClick={() => onOpenSheet("account")} className={`${tab} ${tabState(sheet === "account")}`}>
          {user ? <Avatar user={user} className="h-6 w-6 text-[10px]" /> : <IoPersonOutline className="text-2xl" />}
          {user ? "You" : "Profile"}
        </button>
      </div>
    </nav>
  );
}
