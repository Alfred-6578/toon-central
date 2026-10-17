"use client";

import Link from "next/link";
import { IoCellular, IoLockClosed } from "react-icons/io5";
import { openMtnPay } from "@/components/mtn/MtnPayFlow";
import { UNLOCK_PRICES } from "@/lib/reader";
import { openUnlock } from "./UnlockDialog";

type ReaderGateProps = {
  episode: number;
  lockedCount: number;
  firstEpisodeHref: string;
};

// After the last page: how much is still locked and the quickest ways to read it. Locked pages arrive
// from the server only as blurred previews; unlocking re-renders them clean.
export function ReaderGate({ episode, lockedCount, firstEpisodeHref }: ReaderGateProps) {
  return (
    <div className="mx-4 mt-10 border-2 border-sun bg-panel p-6 text-center sm:mx-0">
      <span className="tag -rotate-2 gap-1.5 bg-sun text-sm"><IoLockClosed /> Locked</span>
      <h2 className="mx-auto mt-4 max-w-md font-display text-4xl uppercase leading-none text-white">
        {lockedCount} {lockedCount === 1 ? "page" : "pages"} of episode {episode} to go
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">
        Unlock the whole episode for <span className="font-bold text-mint">{UNLOCK_PRICES.episode} credits</span>, tap a locked page to unlock
        just that one, or open everything for a day for ₦100 from your MTN line.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => openUnlock({ page: null, preview: null })} className="btn btn-primary px-6 py-3 text-base">
          Unlock episode
        </button>
        <button type="button" onClick={openMtnPay} className="btn gap-2 border-black bg-sun px-6 py-3 text-base text-ink shadow-[3px_3px_0_#000]">
          <IoCellular /> ₦100 with MTN
        </button>
      </div>
      <p className="mt-6 text-xs text-slate-500">
        New here? <Link href={firstEpisodeHref} className="font-semibold text-slate-300 underline-offset-4 hover:underline">Episode 1 is free</Link>
      </p>
    </div>
  );
}
