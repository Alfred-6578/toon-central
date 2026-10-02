"use client";

import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  IoClose,
  IoCloudUploadOutline,
  IoDiamondOutline,
  IoGridOutline,
  IoLibraryOutline,
  IoLogOutOutline,
  IoSchoolOutline,
  IoSettingsOutline,
  IoVideocamOutline,
  IoWalletOutline,
} from "react-icons/io5";
import type { MockNotification, MockUser } from "@/lib/mockSession";

export function MenuPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-2 border-line bg-ink shadow-[6px_6px_0_rgba(0,0,0,0.55)] ${className}`}>
      {children}
    </div>
  );
}

type MenuItemProps = {
  label: string;
  href?: string;
  icon?: IconType;
  hint?: string;
  onClick?: () => void;
};

export function MenuItem({ label, href, icon: Icon, hint, onClick }: MenuItemProps) {
  const className =
    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-panel hover:text-white";
  const content = (
    <>
      {Icon && <Icon className="shrink-0 text-lg text-slate-400" />}
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </>
  );

  return href ? (
    <a href={href} className={className} onClick={onClick}>{content}</a>
  ) : (
    <button type="button" className={className} onClick={onClick}>{content}</button>
  );
}

const MenuDivider = () => <div className="my-1 border-t-2 border-line" />;

export function Avatar({ user, className = "h-9 w-9 text-sm" }: { user: MockUser; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center border-2 border-black bg-sun font-display text-ink ${className}`}>
      {user.initials}
    </span>
  );
}

const publishItems = [
  { href: "/creator/new", icon: IoCloudUploadOutline, label: "Upload comic" },
  { href: "/shorts/upload", icon: IoVideocamOutline, label: "Upload short" },
  { href: "/creator/dashboard", icon: IoGridOutline, label: "Creator dashboard" },
  { href: "/creator101", icon: IoSchoolOutline, label: "Creator101", hint: "Guide" },
];

export function PublishMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="py-1">
      <p className="px-4 pb-1 pt-2 text-xs text-slate-400">Tell your story on Toon Central</p>
      {publishItems.map((item) => (
        <MenuItem key={item.href} {...item} onClick={onNavigate} />
      ))}
    </div>
  );
}

export function AccountMenu({
  user,
  onSignOut,
  onNavigate,
}: {
  user: MockUser;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="py-1">
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar user={user} className="h-11 w-11 text-base" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-400">@{user.username}</p>
        </div>
      </div>

      <div className="mx-4 mb-2 grid grid-cols-2 border-2 border-line text-xs">
        <div className="border-r-2 border-line p-2.5">
          <span className={`tag ${user.plan.tier === "Premium" ? "bg-mint" : "bg-paper"}`}>{user.plan.tier}</span>
          <p className="mt-1.5 text-slate-400">{user.plan.renews ? `Renews ${user.plan.renews}` : "₦500/month"}</p>
        </div>
        <div className="p-2.5">
          <p className="flex items-center gap-1.5 font-semibold text-white">
            <IoWalletOutline className="text-base text-mint" /> {user.credits.toLocaleString()}
          </p>
          <p className="mt-1.5 text-slate-400">Credits</p>
        </div>
      </div>

      <MenuDivider />
      <MenuItem href="/library" icon={IoLibraryOutline} label="My library" onClick={onNavigate} />
      <MenuItem href="/subscription" icon={IoDiamondOutline} label="Subscription" onClick={onNavigate} />
      <MenuItem href="/creator/dashboard" icon={IoGridOutline} label="Creator dashboard" onClick={onNavigate} />
      <MenuItem href="/settings" icon={IoSettingsOutline} label="Settings" onClick={onNavigate} />
      <MenuDivider />
      <MenuItem icon={IoLogOutOutline} label="Sign out" onClick={onSignOut} />
    </div>
  );
}

export function NotificationsMenu({
  items,
  unreadIds,
  onMarkAllRead,
}: {
  items: MockNotification[];
  unreadIds: Set<string>;
  onMarkAllRead: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between border-b-2 border-line px-4 py-3">
        <p className="font-display text-lg uppercase leading-none text-white">Notifications</p>
        {unreadIds.size > 0 && (
          <button type="button" onClick={onMarkAllRead} className="text-xs font-semibold text-mint hover:underline">
            Mark all read
          </button>
        )}
      </div>
      <ul className="max-h-96 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 border-b-2 border-line px-4 py-3 last:border-b-0">
            <span className={`mt-1.5 h-2 w-2 shrink-0 ${unreadIds.has(item.id) ? "bg-mint" : "bg-transparent"}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-400">{item.body}</p>
              <p className="mt-1 text-[11px] text-slate-500">{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Bottom sheet for the mobile tab bar (Publish / account).
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div className="sheet-in absolute inset-x-0 bottom-0 border-t-2 border-mint bg-ink pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <div className="flex items-center justify-between px-4 pb-1 pt-4">
          <p className="font-display text-xl uppercase leading-none text-white">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-slate-300 hover:text-white">
            <IoClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
