export const PAGE_SIZES = {
  // Comic grids are 5 across on desktop: four full rows.
  comics: 20,
  creators: 12,
  episodes: 30,
  shorts: 24,
};

// "?page=3" → 3. Anything else (missing, "abc", "0", "2.5") → 1.
export function pageParam(raw: string | string[] | undefined) {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export type Page<T> = {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  // The requested page was past the end; callers redirect to the last page.
  outOfRange: boolean;
};

export function paginate<T>(items: T[], page: number, perPage: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: current,
    totalPages,
    total: items.length,
    from: items.length ? start + 1 : 0,
    to: Math.min(start + perPage, items.length),
    outOfRange: page > totalPages,
  };
}

// Sets (or, for page 1, removes) ?page= on a URL, keeping its other params.
export function withPage(href: string, page: number) {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  const search = params.toString();
  return `${path}${search ? `?${search}` : ""}`;
}

// Page numbers to show: first, last, and two either side of the current one; gaps become "…".
export function pageWindow(page: number, totalPages: number): (number | "…")[] {
  const keep = new Set([1, totalPages, page - 2, page - 1, page, page + 1, page + 2]);
  const pages = [...keep].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}
