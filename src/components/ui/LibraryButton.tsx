"use client";

import { IoBookmark, IoBookmarkOutline } from "react-icons/io5";
import { useMockLibrary, useMockSession } from "@/lib/mockSession";

// Save-to-library toggle shared with the hero's "+ Library". Signed out, it flips the mock sign-in first.
export function LibraryButton({ uuid, title, className = "" }: { uuid: string; title: string; className?: string }) {
  const { user, signIn } = useMockSession();
  const library = useMockLibrary();
  const saved = library.has(uuid);

  return (
    <button
      type="button"
      onClick={() => {
        if (!user) signIn();
        library.toggle(uuid);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from library` : `Save ${title} to library`}
      className={`flex h-8 w-8 items-center justify-center border-2 text-base transition-colors ${
        saved ? "border-black bg-mint text-ink" : "border-line bg-ink/85 text-white hover:border-mint hover:text-mint"
      } ${className}`}
    >
      {saved ? <IoBookmark /> : <IoBookmarkOutline />}
    </button>
  );
}
