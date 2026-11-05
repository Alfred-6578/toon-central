import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import type { Comic } from "@/lib/api/types";
import { EpisodeNav } from "@/components/reader/EpisodeNav";
import { ReaderActions } from "@/components/reader/ReaderActions";
import { comicHref } from "@/lib/format";

const episodeHref = (uuid: string, n: number) => `/comics/${uuid}/read/${n}`;

export function ReaderTopBar({ comic, episode, total }: { comic: Comic; episode: number; total: number | null }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-ink/95 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-5xl items-center gap-1.5 px-3 py-2 sm:gap-4 sm:px-6">
        <Link href={comicHref(comic.uuid)} className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-300 hover:text-mint">
          <IoArrowBack className="shrink-0 text-lg" />
          <span className="truncate font-semibold">{comic.title}</span>
        </Link>

        <EpisodeNav uuid={comic.uuid} episode={episode} total={total} />

        <div className="flex flex-1 justify-end">
          <ReaderActions uuid={comic.uuid} title={comic.title} episode={episode} />
        </div>
      </div>
    </header>
  );
}

export { episodeHref };
