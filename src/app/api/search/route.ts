import { NextResponse } from "next/server";
import { searchComics } from "@/lib/api/client";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const comics = await searchComics(query.slice(0, 80));
  return NextResponse.json({ comics });
}
