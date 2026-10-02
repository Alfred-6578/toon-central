"use client";

import { IoAdd, IoChevronDown, IoNotificationsOutline, IoSearch } from "react-icons/io5";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import type { MockNotification, MockUser } from "@/lib/mockSession";
import { AccountMenu, Avatar, MenuPanel, NotificationsMenu, PublishMenu } from "./nav/Menus";
import { useDismiss } from "./nav/useDismiss";

export type DesktopMenu = "publish" | "notifications" | "account" | null;

export const navItems = [
  { id: "home", label: "Home", href: "/" },
  { id: "trending", label: "Trending", href: "#trending" },
  { id: "shorts", label: "Shorts", href: "#shorts" },
  { id: "originals", label: "Originals", href: "#originals" },
  { id: "genres", label: "Genres", href: "#genres" },
];

type HeaderProps = {
  user: MockUser | null;
  hidden: boolean;
  activeSection: string;
  openMenu: DesktopMenu;
  onToggleMenu: (menu: Exclude<DesktopMenu, null>) => void;
  onCloseMenu: () => void;
  onOpenSearch: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  notifications: MockNotification[];
  unreadIds: Set<string>;
  onMarkAllRead: () => void;
};

const iconButton =
  "relative flex h-10 w-10 items-center justify-center border-2 border-line text-xl text-slate-200 hover:border-mint hover:text-white";

export function Header({
  user,
  hidden,
  activeSection,
  openMenu,
  onToggleMenu,
  onCloseMenu,
  onOpenSearch,
  onSignIn,
  onSignOut,
  notifications,
  unreadIds,
  onMarkAllRead,
}: HeaderProps) {
  const menuRef = useDismiss<HTMLDivElement>(openMenu !== null, onCloseMenu);
  const refFor = (menu: DesktopMenu) => (openMenu === menu ? menuRef : undefined);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b-2 border-line bg-ink transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-3 md:px-8 lg:px-10">
        <Link href="/" aria-label="Toon Central home" className="shrink-0">
          <Logo className="h-10 w-auto text-mint" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={activeSection === item.id ? "true" : undefined}
              className={`border-b-2 pb-0.5 ${
                activeSection === item.id ? "border-mint text-white" : "border-transparent hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}
          <a href="#subscribe" className="flex items-center gap-1.5 border-b-2 border-transparent pb-0.5 text-sun hover:text-white">
            Subscribe <span className="tag bg-sun">₦500</span>
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={onOpenSearch} aria-label="Search" className={iconButton}>
            <IoSearch />
          </button>

          <div ref={refFor("publish")} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => onToggleMenu("publish")}
              aria-expanded={openMenu === "publish"}
              className="btn btn-ghost h-10"
            >
              <IoAdd className="text-lg" /> Publish <IoChevronDown className="text-sm" />
            </button>
            {openMenu === "publish" && (
              <MenuPanel className="absolute right-0 top-full mt-2 w-64">
                <PublishMenu onNavigate={onCloseMenu} />
              </MenuPanel>
            )}
          </div>

          {user ? (
            <>
              <div ref={refFor("notifications")} className="relative">
                <button
                  type="button"
                  onClick={() => onToggleMenu("notifications")}
                  aria-expanded={openMenu === "notifications"}
                  aria-label={`Notifications${unreadIds.size ? `, ${unreadIds.size} unread` : ""}`}
                  className={iconButton}
                >
                  <IoNotificationsOutline />
                  {unreadIds.size > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center border-2 border-ink bg-sun px-1 text-[10px] font-bold text-ink">
                      {unreadIds.size}
                    </span>
                  )}
                </button>
                {openMenu === "notifications" && (
                  <MenuPanel className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)]">
                    <NotificationsMenu items={notifications} unreadIds={unreadIds} onMarkAllRead={onMarkAllRead} />
                  </MenuPanel>
                )}
              </div>

              <div ref={refFor("account")} className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => onToggleMenu("account")}
                  aria-expanded={openMenu === "account"}
                  aria-label="Account menu"
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white"
                >
                  <Avatar user={user} className="h-10 w-10 text-sm" />
                  <IoChevronDown className="text-sm" />
                </button>
                {openMenu === "account" && (
                  <MenuPanel className="absolute right-0 top-full mt-2 w-72">
                    <AccountMenu user={user} onSignOut={onSignOut} onNavigate={onCloseMenu} />
                  </MenuPanel>
                )}
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={onSignIn} className="btn btn-ghost hidden h-10 lg:inline-flex">
                Sign in
              </button>
              <button type="button" onClick={onSignIn} className="btn btn-primary h-10">
                Join now
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
