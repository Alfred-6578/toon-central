"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { IoCellular, IoCheckmarkCircle, IoClose, IoInformationCircleOutline } from "react-icons/io5";
import { useMockSession } from "@/lib/mockSession";
import { activatePass, isMtnNumber, maskNumber, MTN_DAILY_PRICE, normaliseNigerianNumber } from "@/lib/mtnPass";

// Anything on the page can start the flow; one dialog per page listens.
export const OPEN_MTN = "tc:open-mtn";
export const openMtnPay = () => window.dispatchEvent(new Event(OPEN_MTN));

type Step = "number" | "code" | "confirm" | "done";

// Pay for the Daily pass from an MTN line, signed in or not. Real flow: on MTN mobile data the number
// is detected automatically; otherwise the reader types it and confirms an SMS code; then MTN shows its
// own confirmation page and tells our server the charge went through. Here MTN's part is a labelled stand-in.
export function MtnPayFlow() {
  const router = useRouter();
  const { user } = useMockSession();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("number");
  const [raw, setRaw] = useState("");
  const [number, setNumber] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setStep("number");
      setError(null);
      setCode("");
      setDetected(false);
    };
    window.addEventListener(OPEN_MTN, onOpen);
    return () => window.removeEventListener(OPEN_MTN, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const submitNumber = (event: FormEvent) => {
    event.preventDefault();
    const local = normaliseNigerianNumber(raw);
    if (!local) return setError("Enter an 11-digit Nigerian number, e.g. 0803 123 4567.");
    if (!isMtnNumber(local)) return setError("That isn't an MTN number. MTN can only bill MTN lines; pay by card on the subscription page instead.");
    setError(null);
    setNumber(local);
    setStep("code");
  };

  const submitCode = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");
    setError(null);
    setStep("confirm");
  };

  // Demo of the "on MTN mobile data" case: the network would hand us the number.
  const detect = () => {
    setNumber("08031234567");
    setDetected(true);
    setStep("confirm");
  };

  const confirm = () => {
    activatePass(number!);
    // The server now sends every locked page clean.
    router.refresh();
    setStep("done");
  };

  const input = "h-12 w-full border-2 bg-ink px-3 text-lg text-white outline-none focus:border-mint";

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="mtn-title" className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/75" />
      <div className="sheet-in relative w-full max-w-md border-[3px] border-black bg-ink p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[8px_8px_0_#000] sm:p-6">
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-white">
          <IoClose />
        </button>

        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sun">
          <IoCellular className="text-base" /> Pay with your MTN line
        </p>
        <h2 id="mtn-title" className="mt-1 pr-8 font-display text-3xl uppercase leading-none text-white">
          {step === "done" ? "You're in" : `Daily pass · ₦${MTN_DAILY_PRICE}`}
        </h2>

        {step === "number" && (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Every locked page on Toon Central for 24 hours, charged to your MTN line. {user ? "" : "No account needed."}
            </p>
            <button type="button" onClick={detect} className="mt-5 w-full border-2 border-dashed border-line px-4 py-3 text-left text-sm hover:border-mint">
              <span className="block font-semibold text-white">On MTN mobile data?</span>
              <span className="block text-xs text-slate-400">Demo: MTN would recognise your number automatically. Tap to simulate it.</span>
            </button>
            <form onSubmit={submitNumber} noValidate className="mt-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-200">Or enter your MTN number</span>
                <input
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="0803 123 4567"
                  className={`${input} ${error ? "border-sun" : "border-line"}`}
                />
              </label>
              {error && <p className="mt-1.5 text-xs font-semibold text-sun">{error}</p>}
              <button type="submit" className="btn btn-primary mt-4 w-full px-5 py-3 text-base">Send code</button>
            </form>
          </>
        )}

        {step === "code" && (
          <form onSubmit={submitCode} noValidate>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              We sent a code by SMS to <span className="font-semibold text-white">{maskNumber(number!)}</span>.{" "}
              <button type="button" onClick={() => setStep("number")} className="font-semibold text-mint hover:underline">Change</button>
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              aria-label="SMS code"
              className={`${input} mt-4 text-center font-display text-3xl tracking-[0.5em] ${error ? "border-sun" : "border-line"}`}
            />
            <p className={`mt-1.5 text-xs ${error ? "font-semibold text-sun" : "text-slate-500"}`}>{error ?? "Demo: any 6 digits work."}</p>
            <button type="submit" className="btn btn-primary mt-4 w-full px-5 py-3 text-base">Continue</button>
          </form>
        )}

        {step === "confirm" && (
          <>
            {/* Stand-in for MTN's own confirmation page, which MTN shows and controls. */}
            <div className="mt-4 border-2 border-dashed border-sun p-4">
              <p className="flex items-start gap-2 text-xs leading-5 text-sun">
                <IoInformationCircleOutline className="mt-0.5 shrink-0 text-base" />
                Demo step. On the real site MTN&apos;s confirmation page opens here, and MTN takes the payment.
              </p>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-slate-400">Line</dt>
                <dd className="font-semibold text-white">{maskNumber(number!)} {detected && <span className="text-xs font-normal text-slate-400">(detected)</span>}</dd>
                <dt className="text-slate-400">Service</dt>
                <dd className="font-semibold text-white">Toon Central Daily</dd>
                <dt className="text-slate-400">Price</dt>
                <dd className="font-semibold text-white">₦{MTN_DAILY_PRICE} per day, renews daily until you cancel</dd>
              </dl>
            </div>
            <button type="button" onClick={confirm} className="btn btn-primary mt-5 w-full px-5 py-3 text-base">Confirm and subscribe</button>
            <button type="button" onClick={() => setStep("number")} className="btn btn-ghost mt-2 w-full px-5 py-2.5 text-sm">Back</button>
          </>
        )}

        {step === "done" && (
          <>
            <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-200">
              <IoCheckmarkCircle className="mt-1 shrink-0 text-mint" />
              Every locked page is open for the next 24 hours on {maskNumber(number!)}. It renews daily until you cancel.
            </p>
            {!user && (
              <p className="mt-3 text-xs leading-5 text-slate-400">
                Your pass belongs to your number. Join Toon Central later and we&apos;ll link it to your account.
              </p>
            )}
            <button type="button" onClick={() => setOpen(false)} className="btn btn-primary mt-5 w-full px-5 py-3 text-base">Start reading</button>
          </>
        )}

        <p className="mt-5 text-[11px] leading-4 text-slate-500">
          Charged to your MTN airtime. Cancel any time from Settings or by texting STOP to MTN&apos;s shortcode (confirmed at launch).
        </p>
      </div>
    </div>
  );
}
