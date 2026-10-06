import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { GenreBrowser } from "@/components/genre/GenreBrowser";
import { getGenrePageData } from "@/lib/api/client";
import { genreSlug } from "@/lib/format";

type Params = PageProps<"/genres/[slug]">;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getGenrePageData(genreSlug(decodeURIComponent(slug)), "popular", "all");
  if (!data) return { title: "Genre not found | Toon Central" };
  return {
    title: `${data.genre.name} Mafiki | Toon Central`,
    description: `Read ${data.genre.name} Mafiki from African creators on Toon Central.`,
  };
}

export default async function GenrePage({ params, searchParams }: Params) {
  const [{ slug: raw }, query] = await Promise.all([params, searchParams]);
  // Old or API-style URLs ("/genres/Action", "/genres/Slice%20of%20Life") go to the clean one.
  const slug = genreSlug(decodeURIComponent(raw));
  if (slug !== raw) permanentRedirect(`/genres/${slug}`);
  return <GenreBrowser slug={slug} query={query} />;
}
