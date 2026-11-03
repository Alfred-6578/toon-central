import { NextResponse } from "next/server";
import { checkSession, signOut } from "@/lib/api/account";
import { clearAccessToken, ensureSignedInHint } from "@/lib/api/token";

// Who's signed in, for the browser (the token itself never leaves our server). Read once per page
// load by useMockSession when accounts are live.
export async function GET() {
  const { user, rejected } = await checkSession();
  if (user) await ensureSignedInHint();
  // No token, or one the backend no longer accepts (signed in elsewhere, expired): drop the hint too.
  else if (rejected) await clearAccessToken();
  // `unavailable`: still signed in as far as we know, the backend just didn't answer.
  return NextResponse.json({ user, unavailable: !user && !rejected }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  await signOut();
  return NextResponse.json({ user: null });
}
