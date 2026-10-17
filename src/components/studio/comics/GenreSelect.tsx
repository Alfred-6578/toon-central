"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IoCheckmark, IoChevronDown, IoClose, IoSearch } from "react-icons/io5";

type GenreSelectProps = {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  max: number;
  invalid?: boolean;
};

// Multi-select dropdown: picked genres show as removable tags in the field; the list opens below with
// a search box and checkboxes, and stops accepting more once `max` are picked.
export function GenreSelect({ options, value, onChange, max, invalid = false }: GenreSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const full = value.length >= max;
  const shown = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const onClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (genre: string) => {
    if (value.includes(genre)) onChange(value.filter((g) => g !== genre));
    else if (!full) onChange([...value, genre]);
  };

  return (
    <div ref={root} className="relative max-w-xl">
      <div
        className={`flex min-h-12 w-full items-center gap-2 border-2 bg-ink py-1.5 pl-2 pr-1 ${open ? "border-mint" : invalid ? "border-sun" : "border-line"}`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {value.length === 0 && <span className="px-1 text-base text-slate-500">Choose up to {max} genres</span>}
          {value.map((genre) => (
            <span key={genre} className="flex items-center gap-1 border-2 border-black bg-mint py-0.5 pl-2 pr-1 font-display text-sm uppercase leading-none text-ink">
              {genre}
              <button type="button" onClick={() => toggle(genre)} aria-label={`Remove ${genre}`} className="p-0.5 hover:text-white">
                <IoClose />
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label="Choose genres"
          className="flex h-9 w-9 shrink-0 items-center justify-center text-lg text-slate-300 hover:text-white"
        >
          <IoChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 border-2 border-black bg-ink shadow-[5px_5px_0_#000]">
          <label className="flex items-center gap-2 border-b-2 border-line px-3">
            <IoSearch className="shrink-0 text-slate-500" />
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search genres"
              aria-label="Search genres"
              className="h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
          </label>
          <p className="px-3 pt-2 text-xs text-slate-500">
            {value.length}/{max} picked{full && " · remove one to pick another"}
          </p>
          <ul id={listId} role="listbox" aria-multiselectable="true" className="max-h-64 overflow-y-auto py-1">
            {shown.map((genre) => {
              const on = value.includes(genre);
              const disabled = !on && full;
              return (
                <li key={genre} role="option" aria-selected={on} aria-disabled={disabled}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(genre)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-slate-200 hover:bg-panel disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${on ? "border-black bg-mint text-ink" : "border-line"}`}>
                      {on && <IoCheckmark />}
                    </span>
                    {genre}
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && <li className="px-3 py-3 text-sm text-slate-500">No genre matches &quot;{query}&quot;.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
