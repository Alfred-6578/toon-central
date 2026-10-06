import Link from "next/link";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { pageWindow, withPage, type Page } from "@/lib/pagination";

type PaginationProps = {
  result: Page<unknown>;
  // The current URL without ?page=, e.g. "/genres/action?sort=az".
  baseHref: string;
  // What's being counted, for "21–40 of 46 series".
  noun: string;
  // Keeps the list in view after a page change, e.g. "#episodes".
  hash?: string;
  tone?: "dark" | "paper";
};

// Comic-style pager: square numbered buttons, the current page as a filled block with a hard shadow.
// Phones get Prev / "Page 2 of 5" / Next instead of the full row of numbers.
export function Pagination({ result, baseHref, noun, hash = "", tone = "dark" }: PaginationProps) {
  const { page, totalPages, from, to, total } = result;
  if (totalPages <= 1) return null;

  const onPaper = tone === "paper";
  const href = (p: number) => `${withPage(baseHref, p)}${hash}`;
  const box = "flex h-10 min-w-10 items-center justify-center border-2 px-2 text-sm font-bold";
  const idle = onPaper ? "border-ink text-ink hover:bg-ink hover:text-paper" : "border-line text-slate-200 hover:border-mint hover:text-white";
  const off = onPaper ? "border-ink/20 text-ink/30" : "border-line text-slate-600";
  const current = onPaper
    ? "border-black bg-ink text-paper shadow-[3px_3px_0_var(--color-sun)]"
    : "border-black bg-mint text-ink shadow-[3px_3px_0_var(--color-mint-deep)]";

  const arrow = (target: number, label: string, icon: React.ReactNode, enabled: boolean) =>
    enabled ? (
      <Link href={href(target)} aria-label={label} className={`${box} gap-1 ${idle}`}>{icon}</Link>
    ) : (
      <span aria-hidden="true" className={`${box} gap-1 ${off}`}>{icon}</span>
    );

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {arrow(page - 1, "Previous page", <IoChevronBack />, page > 1)}

        <ol className="hidden items-center gap-2 sm:flex">
          {pageWindow(page, totalPages).map((p, i) =>
            p === "…" ? (
              <li key={`gap-${i}`} aria-hidden="true" className={`px-1 text-sm ${onPaper ? "text-ink/50" : "text-slate-500"}`}>…</li>
            ) : (
              <li key={p}>
                {p === page ? (
                  <span aria-current="page" className={`${box} ${current}`}>{p}</span>
                ) : (
                  <Link href={href(p)} aria-label={`Page ${p}`} className={`${box} ${idle}`}>{p}</Link>
                )}
              </li>
            )
          )}
        </ol>
        <span className={`px-3 text-sm font-semibold sm:hidden ${onPaper ? "text-ink" : "text-slate-200"}`}>
          Page {page} of {totalPages}
        </span>

        {arrow(page + 1, "Next page", <IoChevronForward />, page < totalPages)}
      </div>
      <p className={`text-xs ${onPaper ? "text-ink/60" : "text-slate-500"}`}>
        {from}–{to} of {total} {noun}
      </p>
    </nav>
  );
}
