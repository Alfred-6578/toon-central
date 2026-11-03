import { cookies } from "next/headers";
import { SIGNED_IN_HINT } from "@/lib/session";
import { apiRequest, type ApiResult, type RequestOptions } from "./http";

// The signed-in user's API access token lives in an httpOnly cookie: our server reads it and sends
// it to the backend, but the browser's scripts can never see it (so injected scripts can't steal it).
// Server-only. Setting or clearing it only works in Server Functions and Route Handlers.

export const ACCESS_COOKIE = "tc-access";

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

// Seconds until the token's own expiry (it's a JWT; the backend issues them for about 92 days).
export function tokenLifetime(token: string) {
  try {
    const { exp } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    const seconds = Math.floor(exp - Date.now() / 1000);
    if (seconds > 0) return seconds;
  } catch {
    // Not a JWT we can read: fall back below.
  }
  return 30 * 24 * 60 * 60;
}

const cookieOptions = (maxAge: number) => ({ secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge });

export async function saveAccessToken(token: string, maxAgeSeconds: number) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, token, { ...cookieOptions(maxAgeSeconds), httpOnly: true });
  jar.set(SIGNED_IN_HINT, "1", cookieOptions(maxAgeSeconds));
}

// Sessions from before the hint existed get it on their next session check.
export async function ensureSignedInHint() {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (token && !jar.has(SIGNED_IN_HINT)) jar.set(SIGNED_IN_HINT, "1", cookieOptions(tokenLifetime(token)));
}

export async function clearAccessToken() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(SIGNED_IN_HINT);
}

// A request as the signed-in user. Signed out, it fails like the backend would (401) without calling it.
export async function apiAsUser<T>(path: string, options: Omit<RequestOptions, "token"> = {}): Promise<ApiResult<T>> {
  const token = await getAccessToken();
  if (!token) return { ok: false, status: 401, message: "Not signed in." };
  return apiRequest<T>(path, { ...options, token });
}
