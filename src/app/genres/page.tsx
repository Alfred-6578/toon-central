import type { Metadata } from "next";
import { GenreBrowser } from "@/components/genre/GenreBrowser";
import { getDefaultGenre } from "@/lib/api/client";
import { genreHref, genreSlug } from "@/lib/format";

// /genres is the genre browser with the biggest genre selected; every genre also has its own URL.
export async function generateMetadata(): Promise<Metadata> {
  const genre = await getDefaultGenre();
  return {
    title: "Genres | Toon Central",
    description: "Browse Mafiki by genre, from Action to Isekai/Ojemba.",
    // Same content as the default genre's own page, so point search engines there.
    alternates: genre ? { canonical: genreHref(genre.name) } : undefined,
  };
}

export default async function GenresPage({ searchParams }: PageProps<"/genres">) {
  const [genre, query] = await Promise.all([getDefaultGenre(), searchParams]);
  return <GenreBrowser slug={genre ? genreSlug(genre.name) : ""} query={query} />;
}
