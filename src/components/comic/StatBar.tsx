"use client";

import { FaRegEye } from "react-icons/fa6";
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5";
import { LikeButton } from "@/components/ui/LikeButton";
import { formatCount } from "@/lib/format";
import { useMockLibrary, useMockSession } from "@/lib/mockSession";

// Views, likes and save-to-library as one joined strip beside "Start reading". Views is just a count;
// the heart and the bookmark are buttons. On phones it runs full width under the button, cells shared equally. Signed out, saving flips the mock sign-in first.
export function StatBar({ uuid, title, views, likes }: { uuid: string; title: string; views: number; likes: number }) {
  const { user, signIn } = useMockSession();
  const library = useMockLibrary();
  const saved = library.has(uuid);

  return (
    <div className="flex min-h-12 w-full divide-x-2 divide-white/25 rounded-[3px] border-2 border-white/70 sm:w-auto [&>*]:flex-1 [&>*]:justify-center sm:[&>*]:flex-none">
      <span className="flex items-center gap-2 px-4 font-display text-base uppercase tracking-[0.03em] text-slate-300" title={`${views} reads`}>
        <FaRegEye aria-hidden="true" />
        <span className="sr-only">Reads:</span> {formatCount(views)}
      </span>
      <LikeButton uuid={uuid} title={title} likes={likes} />
      <button
        type="button"
        onClick={() => {
          if (!user) signIn();
          library.toggle(uuid);
        }}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${title} from library` : `Save ${title} to library`}
        title={saved ? "In your library" : user ? "Save to library" : "Signs you in and saves this comic"}
        className={`flex min-w-12 items-center justify-center text-xl transition-colors ${saved ? "bg-mint text-ink" : "text-white hover:bg-white/10"}`}
      >
        {saved ? <IoBookmark /> : <IoBookmarkOutline />}
      </button>
    </div>
  );
}
