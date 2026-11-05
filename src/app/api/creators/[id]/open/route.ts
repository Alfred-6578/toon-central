import { NextResponse } from "next/server";
import { openProfile } from "@/lib/api/client";
import { isLive } from "@/lib/api/config";
import { getAccessToken } from "@/lib/api/token";

// Called once by a creator page when a reader opens it (see openProfile). POST so links, prefetching
// and crawlers never count a profile view. Only the bio comes back.
export async function POST(_request: Request, ctx: RouteContext<"/api/creators/[id]/open">) {
  const { id } = await ctx.params;
  const creatorId = Number(id);
  if (!Number.isInteger(creatorId) || creatorId <= 0) return NextResponse.json({ error: "Unknown creator" }, { status: 404 });

  const profile = await openProfile(creatorId, isLive("accounts") ? await getAccessToken() : null);
  if (!profile) return NextResponse.json({ error: "Profile unavailable" }, { status: 502 });
  return NextResponse.json(profile, { headers: { "Cache-Control": "no-store" } });
}
