"use client";

import { IoLockClosed } from "react-icons/io5";
import { openUnlock } from "./UnlockDialog";

type Props = { number: number; src: string; width: number; height: number };

// A page the server sent only as a blurred, watermarked image. Tapping it opens the unlock dialog.
export function LockedPage({ number, src, width, height }: Props) {
  return (
    <button
      type="button"
      onClick={() => openUnlock({ page: number, preview: src })}
      aria-label={`Page ${number} is locked. Unlock it`}
      className="group relative block w-full overflow-hidden bg-black"
    >
      <img src={src} alt="" width={width} height={height} loading="lazy" decoding="async" className="block h-auto w-full opacity-60" />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center border-[3px] border-black bg-sun text-2xl text-ink shadow-[4px_4px_0_#000] transition-transform group-hover:-translate-y-0.5">
          <IoLockClosed />
        </span>
        <span className="font-display text-2xl uppercase leading-none text-white drop-shadow">Page {number} is locked</span>
        <span className="btn btn-primary px-5 py-2 text-sm">Unlock</span>
      </span>
    </button>
  );
}
