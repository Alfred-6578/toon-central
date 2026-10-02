export type Tone = "mint" | "sun" | "paper";

export const tagStyles: Record<Tone, string> = {
  mint: "bg-mint",
  sun: "bg-sun",
  paper: "bg-paper",
};

const SUN = ["Action", "Superhero", "Military", "Martial Arts", "Sports", "Action Comedy", "Crime"];
const PAPER = ["Romance", "Drama", "Slice of Life", "Coming of Age", "Teen", "School Life", "Heartwarming", "Fantasy Romance", "Comedy"];

export function genreTone(genre: string): Tone {
  if (SUN.includes(genre)) return "sun";
  if (PAPER.includes(genre)) return "paper";
  return "mint";
}

export const genreTag = (genre: string) => tagStyles[genreTone(genre)];
