import type { Creator } from "@/lib/api/types";
import { genreTag } from "@/lib/tagStyles";

// "Sanmi crown" → "SC", "silversnow_nikkitapimwrld" → "SN", "47STUDIOS" → "47".
function initials(username: string) {
  const words = username.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? "?").slice(0, 2).toUpperCase();
}

// Gravatar's generated identicons are placeholders, not real photos.
const isPlaceholder = (photo: string) => photo.includes("gravatar.com");

// Real profile photo when there is one; otherwise an initials block in the creator's main genre colour.
export function CreatorAvatar({ creator, genre, className = "h-12 w-12 text-lg" }: { creator: Creator; genre?: string; className?: string }) {
  if (creator.photo && !isPlaceholder(creator.photo)) {
    return <img src={creator.photo} alt="" className={`shrink-0 border-2 border-black object-cover ${className}`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center border-2 border-black font-display text-ink ${genre ? genreTag(genre) : "bg-sun"} ${className}`}
    >
      {initials(creator.username)}
    </span>
  );
}
