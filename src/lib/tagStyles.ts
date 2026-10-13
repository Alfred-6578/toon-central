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

// One colour per genre for the genre wall's tile washes, so each category reads at a glance.
// Picked to stay distinct side by side; unlisted genres fall back to a stable pick from the same set.
const GENRE_COLORS: Record<string, string> = {
  Action: "#e8372a",
  Adventure: "#f5a623",
  Fantasy: "#7c3aed",
  "Sci-Fi": "#0891b2",
  Romance: "#e11d48",
  Superhero: "#16a34a",
  Supernatural: "#4338ca",
  Teen: "#0ea5e9",
  Drama: "#9333ea",
  Comedy: "#eab308",
  Crime: "#1e3a8a",
  Mystery: "#334155",
  Horror: "#7f1d1d",
  Thriller: "#b91c1c",
  Historical: "#a16207",
  "Slice of Life": "#0d9488",
  "Martial Arts": "#c2410c",
  Military: "#4d7c0f",
  Sports: "#2563eb",
  Tragedy: "#475569",
  Anthology: "#be185d",
  Educational: "#0369a1",
  "Coming of Age": "#d97706",
};
const FALLBACK_COLORS = Object.values(GENRE_COLORS);

export function genreColor(genre: string) {
  if (GENRE_COLORS[genre]) return GENRE_COLORS[genre];
  const hash = [...genre].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}
