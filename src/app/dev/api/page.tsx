import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_AREAS, API_BASE_URL, AREA_LABEL, isLive, type ApiArea } from "@/lib/api/config";
import { ENDPOINTS, type Endpoint } from "@/lib/api/endpoints";
import { apiRequest, isEmpty } from "@/lib/api/http";

export const metadata: Metadata = { title: "API status · Dev | Toon Central", robots: { index: false, follow: false } };

// Always ask the server: this page is a live check.
export const dynamic = "force-dynamic";

type Check =
  | { kind: "ok"; ms: number; message: string }
  | { kind: "fail"; ms: number; status: number; message: string }
  // HTTP 200 with status: false: the backend's way of saying "nothing here" (an empty list).
  | { kind: "empty"; ms: number; message: string }
  | { kind: "skip"; reason: string };

const CHECK_TIMEOUT_MS = 10_000;

// Sample ids for read-only endpoints that need one, taken from a live listing.
type Samples = { comicUuid?: string; creatorId?: string };

function fillPath(path: string, samples: Samples): string | null {
  const filled = path
    .replace(":genreId", "1")
    .replace(":uuid", samples.comicUuid ?? ":uuid")
    .replace(/:(creator_id|user_id)/, samples.creatorId ?? ":$1");
  return filled.includes(":") ? null : filled;
}

const QUERY: Record<string, string> = { search: "query=a&page=1&limit=1" };

async function check(endpoint: Endpoint, samples: Samples): Promise<Check> {
  if (endpoint.changesData) return { kind: "skip", reason: "Changes data" };
  if (endpoint.method !== "GET") return { kind: "skip", reason: `${endpoint.method} request` };
  if (endpoint.auth) return { kind: "skip", reason: "Needs sign-in (Phase 2)" };
  const path = fillPath(endpoint.path, samples);
  if (!path) return { kind: "skip", reason: "Needs an id we don't have yet" };
  const query = QUERY[path] ?? (/(pull|home|trending|genres\/.*\/all)/.test(path) ? "page=1&limit=1" : "");
  const started = Date.now();
  const result = await apiRequest<unknown>(query ? `${path}?${query}` : path, { revalidate: false, timeoutMs: CHECK_TIMEOUT_MS });
  const ms = Date.now() - started;
  if (result.ok) return { kind: "ok", ms, message: result.message };
  if (isEmpty(result)) return { kind: "empty", ms, message: result.message };
  return { kind: "fail", ms, status: result.status, message: result.message };
}

// Developer page (Phase 0 of the API work): where the API is, which areas are live, and a live check of
// every endpoint that's safe to call without signing in. Hidden in production builds unless TOON_DEV_PAGES=1.
export default async function ApiStatusPage() {
  if (process.env.NODE_ENV === "production" && process.env.TOON_DEV_PAGES !== "1") notFound();

  const sample = API_BASE_URL ? await apiRequest<{ comics?: { uuid?: string; userId?: number }[] }>("home/top-carousel?page=1&limit=1", { revalidate: false }) : null;
  const first = sample?.ok ? sample.data.comics?.[0] : undefined;
  const samples: Samples = { comicUuid: first?.uuid, creatorId: first?.userId != null ? String(first.userId) : undefined };

  const results = API_BASE_URL ? await Promise.all(ENDPOINTS.map((e) => check(e, samples))) : ENDPOINTS.map(() => ({ kind: "skip", reason: "No API configured" }) as Check);
  // The sign-in guard: a signed-in endpoint asked without a token should be refused, not answered.
  const guard = API_BASE_URL ? await apiRequest<unknown>("profile", { revalidate: false, timeoutMs: CHECK_TIMEOUT_MS }) : null;

  const rows = ENDPOINTS.map((endpoint, i) => ({ endpoint, result: results[i] }));
  const tally = (kind: Check["kind"]) => results.filter((r) => r.kind === kind).length;
  const okTimes = results.flatMap((r) => (r.kind === "ok" ? [r.ms] : []));
  const median = okTimes.length ? [...okTimes].sort((a, b) => a - b)[Math.floor(okTimes.length / 2)] : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-white md:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sun">Developer · Phase 0</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none">API status</h1>

      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="API address" value={API_BASE_URL ?? "Not set (TOON_API_BASE_URL)"} wide />
        <Fact label="Reachable" value={`${tally("ok")} ok · ${tally("empty")} empty · ${tally("fail")} failed · ${tally("skip")} not called`} />
        <Fact label="Typical response" value={median != null ? `${median} ms` : "—"} />
        <Fact
          label="Sign-in guard"
          value={!guard ? "—" : !guard.ok && guard.status === 401 ? "Working: signed-out requests refused (401)" : `Unexpected: ${guard.ok ? "answered without a token" : guard.status}`}
          wide
        />
      </dl>

      <h2 className="mt-10 font-display text-3xl uppercase">Areas</h2>
      <p className="mt-1 text-sm text-slate-400">Set TOON_API_LIVE to switch an area from the snapshot and browser mocks to the real API.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-5">
        {API_AREAS.map((area) => (
          <li key={area} className={`border-2 p-3 ${isLive(area) ? "border-mint" : "border-line"}`}>
            <p className="text-sm font-semibold">{AREA_LABEL[area]}</p>
            <p className={`mt-1 text-xs font-bold uppercase ${isLive(area) ? "text-mint" : "text-slate-500"}`}>{isLive(area) ? "Live" : "Mock"}</p>
            <p className="mt-1 text-xs text-slate-500">{ENDPOINTS.filter((e) => e.area === area).length} endpoints</p>
          </li>
        ))}
      </ul>

      {API_AREAS.map((area) => (
        <AreaTable key={area} area={area} rows={rows.filter((r) => r.endpoint.area === area)} />
      ))}
    </main>
  );
}

function Fact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`border-2 border-line bg-panel p-3 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 break-all font-semibold">{value}</dd>
    </div>
  );
}

function AreaTable({ area, rows }: { area: ApiArea; rows: { endpoint: Endpoint; result: Check }[] }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl uppercase">{AREA_LABEL[area]}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[44rem] border-2 border-line text-left text-sm">
          <thead className="bg-panel text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">Endpoint</th>
              <th className="px-3 py-2">Request</th>
              <th className="px-3 py-2">Sign-in</th>
              <th className="px-3 py-2">Example</th>
              <th className="px-3 py-2">Check</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-line">
            {rows.map(({ endpoint, result }) => (
              <tr key={`${endpoint.method} ${endpoint.path}`}>
                <td className="px-3 py-2">{endpoint.name}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-300">
                  {endpoint.method} /{endpoint.path}
                </td>
                <td className="px-3 py-2 text-xs">{endpoint.auth ? "Yes" : "—"}</td>
                <td className="px-3 py-2 text-xs">{endpoint.example ? "Yes" : <span className="text-sun">Missing</span>}</td>
                <td className="px-3 py-2 text-xs">
                  {result.kind === "ok" && <span className="font-semibold text-mint">OK · {result.ms} ms</span>}
                  {result.kind === "fail" && (
                    <span className="font-semibold text-[#ff6b6b]">
                      {result.status || "No response"} · {result.message}
                    </span>
                  )}
                  {result.kind === "empty" && <span className="font-semibold text-sun">Empty · {result.message}</span>}
                  {result.kind === "skip" && <span className="text-slate-500">{result.reason}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
