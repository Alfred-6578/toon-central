"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoArrowForward, IoBookOutline, IoCellular, IoCheckmark, IoClose, IoLockClosed, IoWalletOutline } from "react-icons/io5";
import { openMtnPay } from "@/components/mtn/MtnPayFlow";
import { MTN_DAILY_PRICE } from "@/lib/mtnPass";
import { authHref } from "@/lib/auth";
import { useMockSession } from "@/lib/mockSession";
import { UNLOCK_PRICES } from "@/lib/reader";
import { unlock } from "@/lib/unlocks";

// Any locked page (or the end-of-episode block) asks the one dialog to open.
export const OPEN_UNLOCK = "tc:open-unlock";
export type OpenUnlockDetail = { page: number | null; preview: string | null };

export function openUnlock(detail: OpenUnlockDetail) {
  window.dispatchEvent(new CustomEvent<OpenUnlockDetail>(OPEN_UNLOCK, { detail }));
}

type Option = "page" | "episode";

type Props = { uuid: string; episode: number; lockedCount: number };

// The live site's "Unlock panel to read": this page for a day, or the whole episode to keep, paid in
// credits. Signed out → sign in first; not enough credits → buy some or get a pass.
export function UnlockDialog({ uuid, episode, lockedCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useMockSession();
  const [request, setRequest] = useState<OpenUnlockDetail | null>(null);
  const [choice, setChoice] = useState<Option>("page");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<OpenUnlockDetail>).detail;
      setRequest(detail);
      setChoice(detail.page ? "page" : "episode");
    };
    window.addEventListener(OPEN_UNLOCK, onOpen);
    return () => window.removeEventListener(OPEN_UNLOCK, onOpen);
  }, []);

  useEffect(() => {
    if (!request) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRequest(null);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = previous;
    };
  }, [request]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const price = choice === "page" ? UNLOCK_PRICES.page : UNLOCK_PRICES.episode;
  const balance = user?.credits ?? 0;
  const short = user ? price > balance : false;

  const confirm = () => {
    if (!request || !user || short) return;
    setBusy(true);
    unlock(uuid, episode, choice === "page" && request.page ? { page: request.page } : "episode");
    // The server re-renders with the clean pages; nothing is un-hidden in the browser.
    router.refresh();
    setToast(choice === "page" && request.page ? `Page ${request.page} unlocked for 24 hours` : `Episode ${episode} unlocked`);
    setRequest(null);
    setBusy(false);
  };

  const options: { value: Option; icon: typeof IoWalletOutline; title: string; note: string; price: number }[] = [
    ...(request?.page
      ? [{ value: "page" as const, icon: IoWalletOutline, title: `Unlock page ${request.page}`, note: "24-hour access", price: UNLOCK_PRICES.page }]
      : []),
    {
      value: "episode",
      icon: IoBookOutline,
      title: `Unlock all of episode ${episode}`,
      note: `Yours to keep · ${lockedCount} locked ${lockedCount === 1 ? "page" : "pages"}`,
      price: UNLOCK_PRICES.episode,
    },
  ];

  return (
    <>
      {request && (
        <div role="dialog" aria-modal="true" aria-labelledby="unlock-title" className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
          <button type="button" aria-label="Close" onClick={() => setRequest(null)} className="absolute inset-0 bg-black/75" />
          <div className="sheet-in relative w-full max-w-md border-[3px] border-black bg-ink p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[8px_8px_0_#000] sm:p-6">
            <button type="button" onClick={() => setRequest(null)} aria-label="Close" className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-white">
              <IoClose />
            </button>

            <h2 id="unlock-title" className="pr-8 font-display text-3xl uppercase leading-none text-white">Unlock to keep reading</h2>
            <p className="mt-2 text-sm text-slate-400">
              {request.page ? `Page ${request.page} is locked.` : `${lockedCount} pages of this episode are locked.`} Unlock it with credits.
            </p>

            {request.preview && (
              <div className="relative mt-4 h-36 overflow-hidden border-2 border-black bg-black">
                <img src={request.preview} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-11 w-11 items-center justify-center border-2 border-black bg-sun text-xl text-ink shadow-[3px_3px_0_#000]">
                    <IoLockClosed />
                  </span>
                </span>
              </div>
            )}

            <div className="mt-4 grid gap-2.5" role="radiogroup" aria-label="Unlock option">
              {options.map(({ value, icon: Icon, title, note, price: cost }) => {
                const on = choice === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setChoice(value)}
                    className={`flex items-center gap-3 border-2 p-3 text-left transition-colors ${on ? "border-mint bg-panel" : "border-line hover:border-slate-400"}`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-line bg-ink text-lg text-mint">
                      <Icon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-white">{title}</span>
                      <span className="block text-xs text-slate-400">{note}</span>
                    </span>
                    <span className="shrink-0 font-display text-xl text-white">{cost}</span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 text-sm ${on ? "border-black bg-mint text-ink" : "border-line text-transparent"}`}
                    >
                      <IoCheckmark />
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
              <span>Prices in credits</span>
              {user && (
                <span className={short ? "font-semibold text-sun" : ""}>
                  <IoWalletOutline className="mr-1 inline" />
                  Balance: {balance.toLocaleString()}
                </span>
              )}
            </p>

            {short && (
              <p className="mt-3 border-2 border-sun px-3 py-2 text-sm text-slate-200">
                You need {price - balance} more credits.{" "}
                <Link href="/subscription#credits" className="font-semibold text-mint hover:underline">Buy credits</Link>
              </p>
            )}

            {/* Fastest way in, for everyone (no account or credits needed), so it comes first. */}
            <button
              type="button"
              onClick={() => {
                setRequest(null);
                openMtnPay();
              }}
              className="btn mt-5 w-full gap-2 border-black bg-sun px-4 py-3 text-base text-ink shadow-[4px_4px_0_#000] hover:bg-white"
            >
              <IoCellular className="text-lg" /> Pay ₦{MTN_DAILY_PRICE} with MTN <IoArrowForward />
            </button>
            <p className="mt-1.5 text-center text-xs text-slate-400">
              Every locked page for 24 hours{user ? ", charged to your MTN line." : ". No account needed."}
            </p>

            <div className="mt-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500" aria-hidden="true">
              <span className="h-0.5 flex-1 bg-line" /> or <span className="h-0.5 flex-1 bg-line" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {user ? (
                <button type="button" onClick={confirm} disabled={busy || short} className="btn btn-primary px-4 py-3 text-base disabled:opacity-40">
                  {choice === "page" ? "Unlock page" : "Unlock episode"}
                </button>
              ) : (
                <Link href={authHref("signin", pathname)} className="btn btn-primary px-4 py-3 text-base">Sign in to unlock</Link>
              )}
              <button type="button" onClick={() => setRequest(null)} className="btn btn-ghost px-4 py-3 text-base">Cancel</button>
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              Other passes and plans are on the{" "}
              <Link href="/subscription#special-offers" className="font-semibold text-mint hover:underline">subscription page</Link>.
            </p>
          </div>
        </div>
      )}

      {toast && (
        <p role="status" className="slide-up fixed bottom-24 left-1/2 z-[95] -translate-x-1/2 border-2 border-black bg-mint px-4 py-2 text-sm font-bold text-ink shadow-[4px_4px_0_#000]">
          {toast}
        </p>
      )}
    </>
  );
}
