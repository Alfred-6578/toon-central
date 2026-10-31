import { API_BASE_URL } from "./config";
import { camelize } from "./normalize";

// The one way the site talks to the backend. Every response comes back as a result instead of
// throwing, so callers decide what a failure means (fall back to the snapshot, show a form error…).

// The backend wraps everything as { status, message, data }; errors as { status: false, message },
// and form validation (422) adds { errors: { field: ["…"] } }.
type Envelope = { status?: boolean; success?: boolean; message?: string; data?: unknown; errors?: Record<string, string[]> };

export type ApiResult<T> =
  | { ok: true; data: T; message: string }
  // status 0: never reached the server (not configured, offline, timed out).
  | { ok: false; status: number; message: string; errors?: Record<string, string[]> };

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: Method;
  // JSON for plain objects; sent as-is for uploads (FormData).
  body?: Record<string, unknown> | FormData;
  // The signed-in user's access token, sent as a Bearer header.
  token?: string | null;
  // Seconds a public GET may be served from cache; false to always ask the server.
  revalidate?: number | false;
  timeoutMs?: number;
};

// The backend answers an empty list with HTTP 200 and status: false ("no record found").
export const isEmpty = (result: ApiResult<unknown>) => !result.ok && result.status === 200 && /no record/i.test(result.message);

const DEFAULT_REVALIDATE = 300;
const DEFAULT_TIMEOUT_MS = 15_000;

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  if (!API_BASE_URL) return { ok: false, status: 0, message: "The API isn't configured (TOON_API_BASE_URL)." };

  const { method = "GET", body, token, revalidate = DEFAULT_REVALIDATE, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  // Only public reads are cached: anything signed in is one person's data, and writes must reach the server.
  const cacheable = method === "GET" && !token && revalidate !== false;

  try {
    const res = await fetch(`${API_BASE_URL}/${path.replace(/^\//, "")}`, {
      method,
      headers,
      body: payload,
      signal: AbortSignal.timeout(timeoutMs),
      ...(cacheable ? { next: { revalidate } } : { cache: "no-store" as const }),
    });
    const json = (await res.json().catch(() => null)) as Envelope | null;
    if (!json) return { ok: false, status: res.status, message: `The server didn't send JSON (${res.status} ${res.statusText}).` };
    // Note: an empty list also comes back as HTTP 200 with status: false ("no record found").
    if (!res.ok || json.status === false || json.success === false) {
      return { ok: false, status: res.status, message: json.message || res.statusText || "Something went wrong", errors: json.errors };
    }
    return { ok: true, data: camelize<T>(json.data), message: json.message ?? "" };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return { ok: false, status: 0, message: timedOut ? "The server took too long to respond." : "Couldn't reach the server." };
  }
}
