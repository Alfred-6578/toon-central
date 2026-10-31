import Link from "next/link";

export type TabLink = { value: string; label: string; count: number; href: string };

// A row of section tabs as plain links (e.g. ?tab=shorts), so the page renders on the server, each view
// can be shared, and the page doesn't jump when switching (scroll={false}).
export function TabLinks({ items, current, label }: { items: TabLink[]; current: string; label: string }) {
  return (
    <nav aria-label={label} className="mb-5 flex gap-2 border-b-2 border-line">
      {items.map(({ value, label: text, count, href }) => {
        const active = value === current;
        return (
          <Link
            key={value}
            href={href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`-mb-0.5 flex items-center gap-2 border-2 px-4 py-2.5 font-display text-2xl uppercase leading-none sm:text-3xl ${
              active ? "border-line border-b-ink bg-ink text-white" : "border-transparent text-slate-500 hover:text-white"
            }`}
          >
            {text}
            {count > 0 && (
              <span className={`min-w-6 px-1.5 py-0.5 text-center font-sans text-xs font-bold ${active ? "bg-mint text-ink" : "bg-panel text-slate-400"}`}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
