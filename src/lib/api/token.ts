import { cookies } from "next/headers";
import { apiRequest, type ApiResult, type RequestOptions } from "./http";

// The signed-in user's API access token lives in an httpOnly cookie: our server reads it and sends
// it to the backend, but the browser's scripts can never see it (so injected scripts can't steal it).
// Server-only. Setting or clearing it only works in Server Functions and Route Handlers.

export const ACCESS_COOKIE = "tc-access";

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

export async function saveAccessToken(token: string, maxAgeSeconds: number) {
  (await cookies()).set(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearAccessToken() {
  (await cookies()).delete(ACCESS_COOKIE);
}

// A request as the signed-in user. Signed out, it fails like the backend would (401) without calling it.
export async function apiAsUser<T>(path: string, options: Omit<RequestOptions, "token"> = {}): Promise<ApiResult<T>> {
  const token = await getAccessToken();
  if (!token) return { ok: false, status: 401, message: "Not signed in." };
  return apiRequest<T>(path, { ...options, token });
}
