import { isLive } from "@/lib/api/config";
import { apiRequest } from "@/lib/api/http";
import { getAccessToken } from "@/lib/api/token";

// Counts a view of a short (shorts/:uuid/view), called by the feed once a short has really played
// (lib/shortViews.ts). POST so links and crawlers never count one. The backend counts every call when
// signed out, and once per reader when signed in, so the reader's token is sent when there is one.
export async function POST(_request: Request, ctx: RouteContext<"/api/shorts/[uuid]/view">) {
  const { uuid } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(uuid)) return new Response(null, { status: 404 });
  if (!isLive("reading")) return new Response(null, { status: 204 });

  const token = isLive("accounts") ? await getAccessToken() : null;
  const result = await apiRequest(`/shorts/${uuid}/view`, { token, revalidate: false });
  if (!result.ok) console.error(`[api] GET shorts/${uuid}/view failed: ${result.status} ${result.message}`);
  return new Response(null, { status: result.ok ? 204 : 502 });
}
