import Link from "next/link";
import { IoPersonCircle } from "react-icons/io5";
import type { Comic } from "@/lib/api/types";
import { authHref } from "@/lib/auth";
import type { ReaderPage } from "@/lib/reader";
import { GateEpisodeLinks } from "./GateEpisodeLinks";

type SignInGateProps = {
  comic: Comic;
  episode: number;
  total: number | null;
  // Stand-in pages blurred past reading (signInPreviewPages), so the episode still looks like an episode.
  pages: ReaderPage[];
  // This episode's address, so signing in brings the reader straight back to it.
  next: string;
  // Accounts aren't live, so signing in here can't open the episode yet (preview builds only).
  preview: boolean;
};

// What a signed-out reader gets from episode 2 on (the backend only serves episode 1 to visitors): the
// top of the episode, blurred and fading out, with the sign-in card over it. Exactly one screen tall,
// so there's nothing to scroll to.
export function SignInGate({ comic, episode, total, pages, next, preview }: SignInGateProps) {
  return (
    <div className="relative h-[calc(100dvh-56px)] overflow-hidden">
      <div aria-hidden="true">
        {pages.map((page) => (
          <img key={page.number} src={page.src} alt="" width={page.width} height={page.height} className="block h-auto w-full opacity-50" />
        ))}
      </div>
      {/* The episode vanishing into the page below. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-ink/80 to-ink" />

      <div className="absolute inset-0 flex items-center justify-center px-4 pb-16 sm:px-10">
        <div className="w-full max-w-md border-[3px] border-black bg-paper p-6 text-center text-ink shadow-[8px_8px_0_#000] sm:p-8">
          <span className="tag -rotate-2 gap-1.5 bg-mint text-sm"><IoPersonCircle /> Free with an account</span>
          <h1 className="mt-4 text-balance font-display text-4xl uppercase leading-none sm:text-5xl">Sign in to read episode {episode}</h1>
          <p className="mt-3 text-sm leading-6 text-ink/75">
            Episode 1 of {comic.title} is open to everyone. To keep reading, sign in or join Toon Central. It&apos;s free, and we&apos;ll keep
            your place in every Mafiki.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={authHref("signup", next)} className="btn btn-primary px-6 py-3 text-base">Join free</Link>
            <Link href={authHref("signin", next)} className="btn border-black bg-white px-6 py-3 text-base text-ink shadow-[3px_3px_0_#000]">
              Sign in
            </Link>
          </div>
          <GateEpisodeLinks uuid={comic.uuid} episode={episode} total={total} />
          {preview && (
            <p className="mt-5 border-2 border-dashed border-ink/25 px-3 py-2 text-xs leading-5 text-ink/60">
              Preview build: real sign-in isn&apos;t connected yet. The demo sign-in opens this episode with stand-in pages.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
