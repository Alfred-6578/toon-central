"use client";

import { useState } from "react";
import { FaFacebookF, FaXTwitter } from "react-icons/fa6";
import { IoBookmark, IoBookmarkOutline, IoCopyOutline, IoShareSocialOutline } from "react-icons/io5";
import { useMockLibrary, useMockSession } from "@/lib/mockSession";

const iconButton =
  "flex h-9 w-9 items-center justify-center border-2 border-line text-base text-slate-200 transition-colors hover:border-mint hover:text-white";

const popup = (url: string) => window.open(url, "_blank", "noopener,noreferrer,width=620,height=560");

// Library bookmark plus share buttons for the episode being read. Facebook, X and copy sit in the bar from
// `sm` up; phones get one share button that opens the phone's own share sheet.
export function ReaderActions({ uuid, title, episode }: { uuid: string; title: string; episode: number }) {
  const { user, signIn } = useMockSession();
  const library = useMockLibrary();
  const saved = library.has(uuid);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  };

  const pageUrl = () => window.location.href.split("#")[0];
  const text = `Reading "${title}" episode ${episode} on Toon Central`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      flash("Link copied");
    } catch {
      flash("Couldn't copy the link");
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title, text, url: pageUrl() });
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") copy();
    }
  };

  return (
    <div className="relative flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        data-tour="library"
        onClick={() => {
          if (!user) signIn();
          library.toggle(uuid);
          flash(saved ? "Removed from library" : "Added to library");
        }}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${title} from library` : `Add ${title} to library`}
        title={saved ? "In your library" : "Add to library"}
        className={`flex h-9 w-9 items-center justify-center border-2 text-lg transition-colors ${
          saved ? "border-black bg-mint text-ink shadow-[2px_2px_0_var(--color-mint-deep)]" : "border-line text-slate-200 hover:border-mint hover:text-white"
        }`}
      >
        {saved ? <IoBookmark /> : <IoBookmarkOutline />}
      </button>

      <div data-tour="share" className="flex items-center gap-1.5">
        <button type="button" onClick={nativeShare} aria-label="Share this episode" className={`${iconButton} sm:hidden`}>
          <IoShareSocialOutline />
        </button>
        <button
          type="button"
          onClick={() => popup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}`)}
          aria-label="Share on Facebook"
          title="Share on Facebook"
          className={`${iconButton} hidden text-sm sm:flex`}
        >
          <FaFacebookF />
        </button>
        <button
          type="button"
          onClick={() => popup(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl())}`)}
          aria-label="Share on X"
          title="Share on X"
          className={`${iconButton} hidden text-sm sm:flex`}
        >
          <FaXTwitter />
        </button>
        <button type="button" onClick={copy} aria-label="Copy link" title="Copy link" className={`${iconButton} hidden sm:flex`}>
          <IoCopyOutline />
        </button>
      </div>

      <p
        role="status"
        className={`pointer-events-none absolute right-0 top-full mt-3 whitespace-nowrap border-2 border-black bg-mint px-3 py-1.5 text-xs font-bold text-ink shadow-[3px_3px_0_#000] transition-opacity ${
          toast ? "opacity-100" : "opacity-0"
        }`}
      >
        {toast}
      </p>
    </div>
  );
}
