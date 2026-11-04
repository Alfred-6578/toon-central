import { NextResponse } from "next/server";
import { openComic } from "@/lib/api/client";
import { isLive } from "@/lib/api/config";
import { getAccessToken } from "@/lib/api/token";

// Called once by the comic page when a reader opens it. POST so links, prefetching and crawlers that
// only follow links never count a view.
export async function POST(_request: Request, ctx: RouteContext<"/api/comics/[uuid]/open">) {
  const { uuid } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(uuid)) return NextResponse.json({ error: "Unknown Mafiki" }, { status: 404 });

  const details = await openComic(uuid, isLive("accounts") ? await getAccessToken() : null);
  if (!details) return NextResponse.json({ error: "Episodes unavailable" }, { status: 502 });
  return NextResponse.json(details, { headers: { "Cache-Control": "no-store" } });
}
