import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Comic, Genre } from "@/lib/api/types";
import type { DesignChoice } from "@/lib/designOptions";
import { GenreTiles } from "./genres/GenreTiles";
import { GenreWall } from "./genres/GenreWall";

type GenresSectionProps = {
  genres: Genre[];
  comics: Comic[];
  counts: Map<number, number>;
  countSource: "catalogue" | "page";
  variant?: DesignChoice<"genres">;
};

export function GenresSection({ genres, comics, counts, countSource, variant = "wall" }: GenresSectionProps) {
  return (
    <section id="genres" className="mt-14">
      <RevealOnScroll className="block">
        <SectionHeader title="Browse by genre" action={`All ${genres.length} genres`} />

        {variant === "wall" ? (
          <GenreWall genres={genres} comics={comics} counts={counts} countSource={countSource} />
        ) : (
          <GenreTiles genres={genres} comics={comics} counts={counts} />
        )}
      </RevealOnScroll>
    </section>
  );
}
