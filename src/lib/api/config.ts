// Where the backend lives and which parts of the site use it. Each area goes live on its own (see
// docs/api/PHASES.md): list it in TOON_API_LIVE, e.g. "reading,accounts". An area left out keeps
// using the snapshot and browser mocks, so a misbehaving endpoint can be switched off without
// taking anything else down.

export const API_AREAS = ["reading", "accounts", "readerActions", "money", "studio"] as const;
export type ApiArea = (typeof API_AREAS)[number];

export const AREA_LABEL: Record<ApiArea, string> = {
  reading: "Public reading",
  accounts: "Accounts",
  readerActions: "Reader actions",
  money: "Money",
  studio: "Creator Studio",
};

export const API_BASE_URL = process.env.TOON_API_BASE_URL?.trim().replace(/\/$/, "") || null;

const live = new Set(
  (process.env.TOON_API_LIVE ?? "")
    .split(",")
    .map((area) => area.trim())
    .filter(Boolean)
);

export const isLive = (area: ApiArea) => API_BASE_URL !== null && (live.has(area) || live.has("all"));
