"use client";

import Link from "next/link";
import { useState } from "react";
import { IoChevronDown, IoColorPaletteOutline } from "react-icons/io5";
import { designHref, designOptions, type DesignKey, type DesignSelection } from "@/lib/designOptions";

// Client-review switcher. Each option is a URL param, so every combination has a shareable link.
// Remove from page.tsx once a direction is chosen.
export function DesignOptions({ selection }: { selection: DesignSelection }) {
  // null = not toggled yet: expanded on desktop, collapsed on phones so it doesn't cover the page.
  const [open, setOpen] = useState<boolean | null>(null);
  const keys = Object.keys(designOptions) as DesignKey[];

  return (
    <div className="fixed bottom-24 left-4 z-30 lg:bottom-6 lg:left-6">
      {open !== false && (
        <div className={`w-64 border-2 border-sun bg-ink shadow-[5px_5px_0_rgba(0,0,0,0.6)] ${open === null ? "hidden lg:block" : ""}`}>
          <div className="flex items-center justify-between border-b-2 border-line px-3 py-2">
            <span className="flex items-center gap-2 font-display text-sm uppercase tracking-wide text-sun">
              <IoColorPaletteOutline className="text-base" /> Design options
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Collapse design options" className="text-slate-400 hover:text-white">
              <IoChevronDown />
            </button>
          </div>
          <div className="space-y-3 p-3">
            {keys.map((key) => (
              <div key={key}>
                <p className="mb-1.5 text-xs font-semibold text-slate-400">{designOptions[key].label}</p>
                <div className="grid grid-cols-2 border-2 border-line">
                  {Object.entries(designOptions[key].choices).map(([choice, label]) => {
                    const active = selection[key] === choice;
                    return (
                      <Link
                        key={choice}
                        href={designHref(selection, key, choice)}
                        scroll={false}
                        aria-current={active ? "true" : undefined}
                        className={`px-2 py-1.5 text-center text-xs font-semibold ${
                          active ? "bg-sun text-ink" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {open !== true && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Show design options"
          className={`h-11 w-11 items-center justify-center border-2 border-sun bg-ink text-xl text-sun shadow-[4px_4px_0_rgba(0,0,0,0.6)] ${
            open === null ? "flex lg:hidden" : "flex"
          }`}
        >
          <IoColorPaletteOutline />
        </button>
      )}
    </div>
  );
}
