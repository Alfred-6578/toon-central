// Shared by the /auth pages and the buttons that link to them.

export type AuthMode = "signin" | "signup" | "forgot";

// Where to send someone after they sign in. Only paths on this site: "//evil.com" or "https://…"
// would turn the sign-in page into an open redirect, and /auth pages would loop.
export function safeNext(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (raw === "/auth" || raw.startsWith("/auth/") || raw.startsWith("/auth?")) return "/";
  return raw;
}

export function authHref(mode: AuthMode, next?: string) {
  const back = next ? safeNext(next) : "/";
  return `/auth/${mode}${back !== "/" ? `?next=${encodeURIComponent(back)}` : ""}`;
}

export const PASSWORD_MIN = 8;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

// Nigerian mobile numbers, typed as 0803…, 803…, 234803… or +234 803…; sent as 0803… (11 digits).
export function localPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");
  return /^[789]\d{9}$/.test(digits) ? `0${digits}` : null;
}

export const PHONE_HINT = "Enter a Nigerian mobile number, e.g. 0803 123 4567.";
