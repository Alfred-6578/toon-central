import Link from "next/link";
import { IoArrowBack, IoChevronBack, IoChevronForward } from "react-icons/io5";
import type { Comic } from "@/lib/api/types";
import { ReaderActions } from "@/components/reader/ReaderActions";
import { comicHref } from "@/lib/format";

const episodeHref = (uuid: string, n: number) => `/comics/${uuid}/read/${n}`;

const navButton =
  "flex h-9 w-9 items-center justify-center border-2 border-line text-lg text-slate-200 hover:border-mint hover:text-white";
const navButtonOff = "flex h-9 w-9 items-center justify-center border-2 border-line text-lg text-slate-600";

export function ReaderTopBar({ comic, episode, total }: { comic: Comic; episode: number; total: number | null }) {
  const hasPrev = episode > 1;
  const hasNext = total != null && episode < total;

  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-ink/95 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6">
        <Link href={comicHref(comic.uuid)} className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-300 hover:text-mint">
          <IoArrowBack className="shrink-0 text-lg" />
          <span className="truncate font-semibold">{comic.title}</span>
        </Link>

        <div data-tour="episodes" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {hasPrev ? (
            <Link href={episodeHref(comic.uuid, episode - 1)} aria-label="Previous episode" className={navButton}><IoChevronBack /></Link>
          ) : (
            <span aria-hidden="true" className={navButtonOff}><IoChevronBack /></span>
          )}
          <p className="min-w-[3.25rem] text-center font-display text-lg uppercase leading-none text-white sm:text-xl">
            Ep {episode}
            {total != null && <span className="hidden text-slate-500 sm:inline"> / {total}</span>}
          </p>
          {hasNext ? (
            <Link href={episodeHref(comic.uuid, episode + 1)} aria-label="Next episode" className={navButton}><IoChevronForward /></Link>
          ) : (
            <span aria-hidden="true" className={navButtonOff}><IoChevronForward /></span>
          )}
        </div>

        <div className="flex flex-1 justify-end">
          <ReaderActions uuid={comic.uuid} title={comic.title} episode={episode} />
        </div>
      </div>
    </header>
  );
}

export { episodeHref };
