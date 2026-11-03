import { NextResponse } from "next/server";
import { getSessionUser, signOut } from "@/lib/api/account";

// Who's signed in, for the browser (the token itself never leaves our server). Read once per page
// load by useMockSession when accounts are live.
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  await signOut();
  return NextResponse.json({ user: null });
}
