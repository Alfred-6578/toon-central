// Cookie the mock sign-in sets so server-rendered pages (the reader) can see who's "signed in".
// Demo only: a real session must be a signed, httpOnly cookie issued and verified by the server.
// This one is written by the browser, so anyone could set it.
export const SESSION_COOKIE = "tc-mock-signed-in";

// Mock record of what this reader has unlocked with credits, so the reader page (server) knows which
// pages to send clean. JSON: { "<comic>:<episode>": "full", "<comic>:<episode>:<page>": <expiry ms> }.
// Demo only, and NOT secure: it's written by the browser. Real unlocks are recorded by the server
// after it deducts the credits, and the server checks its own record, never a cookie the reader holds.
export const UNLOCKS_COOKIE = "tc-mock-unlocks";

export type Unlocks = Record<string, "full" | number>;

export const episodeKey = (uuid: string, episode: number) => `${uuid}:${episode}`;
export const pageKey = (uuid: string, episode: number, page: number) => `${uuid}:${episode}:${page}`;

export function parseUnlocks(raw: string | undefined): Unlocks {
  if (!raw) return {};
  try {
    const value = JSON.parse(decodeURIComponent(raw));
    return value && typeof value === "object" ? (value as Unlocks) : {};
  } catch {
    return {};
  }
}

// Mock MTN Daily pass: paid from an MTN line, it unlocks every locked page until it ends.
// JSON: { msisdn, until }. Demo only and NOT secure (browser-written). For real, MTN confirms the
// charge to the server, which keeps the pass against the phone number and issues its own session.
export const PASS_COOKIE = "tc-mock-pass";

// `renews: false` once cancelled: access lasts until `until`, then it isn't charged again.
export type Pass = { msisdn: string; until: number; renews?: boolean };

export function parsePass(raw: string | undefined): Pass | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw));
    return value && typeof value.until === "number" && typeof value.msisdn === "string" ? (value as Pass) : null;
  } catch {
    return null;
  }
}
