"use client";

import { useEffect, useState } from "react";
import { IoCellular } from "react-icons/io5";
import { cancelPass, maskNumber, usePass } from "@/lib/mtnPass";

const hoursLeft = (until: number, now: number) => Math.max(1, Math.ceil((until - now) / 3_600_000));

// Shown while a pass is active: whose line, how long is left, and how to cancel.
export function PassBanner() {
  const pass = usePass();
  const [now, setNow] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  if (!pass || now == null || pass.until <= now) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-mint bg-panel px-4 py-2.5 text-sm">
      <p className="flex items-center gap-2 text-slate-200">
        <IoCellular className="text-mint" />
        <span>
          <span className="font-semibold text-white">MTN Daily pass</span> · {maskNumber(pass.msisdn)} ·{" "}
          {pass.renews === false ? `ends in ${hoursLeft(pass.until, now)}h, won't renew` : `renews in ${hoursLeft(pass.until, now)}h`}
        </span>
      </p>
      {pass.renews === false ? null : confirming ? (
        <span className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              cancelPass(pass);
              setConfirming(false);
            }}
            className="font-bold text-sun hover:underline"
          >
            Stop renewing
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="text-slate-400 hover:text-white">Keep</button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="text-xs font-semibold text-slate-400 hover:text-white">Cancel pass</button>
      )}
    </div>
  );
}
