"use client";

import { useCallback, useEffect, useState } from "react";
import { mockNotifications, useMockSession } from "@/lib/mockSession";
import { Header, navItems, type DesktopMenu } from "./Header";
import { MobileNav, type MobileSheet } from "./MobileNav";
import { AccountMenu, PublishMenu, Sheet } from "./nav/Menus";
import { SearchPanel } from "./nav/SearchPanel";

const SPY_SECTIONS = navItems.map((item) => item.id).filter((id) => id !== "home");

// Owns everything the header and mobile tab bar share: session, menus, search, scroll state.
export function Navigation() {
  const { user, signIn, signOut } = useMockSession();
  const [openMenu, setOpenMenu] = useState<DesktopMenu>(null);
  const [sheet, setSheet] = useState<MobileSheet>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolledAway, setScrolledAway] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [unreadIds, setUnreadIds] = useState(() => new Set(mockNotifications.map((n) => n.id)));

  const closeMenu = useCallback(() => setOpenMenu(null), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openSearch = useCallback(() => {
    setOpenMenu(null);
    setSheet(null);
    setSearchOpen(true);
  }, []);

  // Hide the header while scrolling down, bring it back on the way up.
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 300) setActiveSection("home");
      if (Math.abs(y - lastY) < 6) return;
      setScrolledAway(y > lastY && y > 120);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Underline the nav item for whichever section is in the middle of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    SPY_SECTIONS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  // "/" or Cmd/Ctrl+K opens search from anywhere that isn't a text field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((event.key === "/" && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        openSearch();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  // Freeze page scroll behind full-screen overlays.
  useEffect(() => {
    if (!searchOpen && !sheet) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [searchOpen, sheet]);

  const handleSignIn = () => {
    signIn();
    setSheet(null);
  };
  const handleSignOut = () => {
    signOut();
    setOpenMenu(null);
    setSheet(null);
  };

  return (
    <>
      <Header
        user={user}
        hidden={scrolledAway && !openMenu && !searchOpen}
        activeSection={activeSection}
        openMenu={openMenu}
        onToggleMenu={(menu) => setOpenMenu((current) => (current === menu ? null : menu))}
        onCloseMenu={closeMenu}
        onOpenSearch={openSearch}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        notifications={mockNotifications}
        unreadIds={unreadIds}
        onMarkAllRead={() => setUnreadIds(new Set())}
      />

      <MobileNav
        user={user}
        activeSection={activeSection}
        sheet={sheet}
        onOpenSearch={openSearch}
        onOpenSheet={(next) => setSheet((current) => (current === next ? null : next))}
      />

      <Sheet open={sheet === "publish"} title="Publish" onClose={closeSheet}>
        <PublishMenu onNavigate={closeSheet} />
      </Sheet>

      <Sheet open={sheet === "account"} title={user ? "Your account" : "Join Toon Central"} onClose={closeSheet}>
        {user ? (
          <AccountMenu user={user} onSignOut={handleSignOut} onNavigate={closeSheet} />
        ) : (
          <div className="px-4 pb-4 pt-2">
            <p className="text-sm leading-6 text-slate-300">
              Save series to your library, get new-episode alerts and support African creators.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={handleSignIn} className="btn btn-ghost h-11">Sign in</button>
              <button type="button" onClick={handleSignIn} className="btn btn-primary h-11">Join now</button>
            </div>
          </div>
        )}
      </Sheet>

      <SearchPanel open={searchOpen} onClose={closeSearch} />
    </>
  );
}
