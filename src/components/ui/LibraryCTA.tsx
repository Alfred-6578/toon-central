"use client";

import { IoAdd, IoCheckmark } from "react-icons/io5";
import { useMockLibrary, useMockSession } from "@/lib/mockSession";

// Labelled "+ Library / In library" button (hero, comic page). Signed out, it flips the mock sign-in first.
export function LibraryCTA({ uuid, className = "px-5 py-3 text-base" }: { uuid: string; className?: string }) {
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
      title={user ? undefined : "Signs you in and saves this Mafiki"}
      className={`btn btn-ghost ${className}`}
    >
      {saved ? <IoCheckmark className="text-lg" /> : <IoAdd className="text-lg" />}
      {saved ? "In library" : "Library"}
    </button>
  );
}
