import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  action?: string;
  tone?: "dark" | "paper";
  children?: ReactNode;
};

export function SectionHeader({ title, action = "View all", tone = "dark", children }: SectionHeaderProps) {
  const onPaper = tone === "paper";

  return (
    <div className={`mb-5 flex items-end justify-between gap-4 border-b-2 pb-3 ${onPaper ? "border-ink" : "border-line"}`}>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <h2 className={`font-display text-3xl uppercase leading-none sm:text-4xl ${onPaper ? "text-ink" : "text-white"}`}>{title}</h2>
        {children}
      </div>
      <a
        href="#"
        className={`shrink-0 text-sm font-semibold ${onPaper ? "text-ink underline-offset-4 hover:underline" : "text-slate-300 hover:text-mint"}`}
      >
        {action} →
      </a>
    </div>
  );
}
