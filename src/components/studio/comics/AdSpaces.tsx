"use client";

import Link from "next/link";
import { IoCheckmark, IoMegaphoneOutline } from "react-icons/io5";
import { AD_SPOT_LABEL, AD_SPOTS, adSpotsAllowed, adSpotsOf, MAX_AD_SPOTS, MILESTONE_EPISODES, publishedCount, type AdSpot, type StudioComic } from "@/lib/studioModel";

// Where advertisers can buy a spot in every episode of this Mafiki: top, middle and/or bottom, up to
// MAX_AD_SPOTS, once the Mafiki has MILESTONE_EPISODES episodes out. Saved as soon as a spot is tapped,
// like the rest of the Studio.
export function AdSpaces({ comic, onChange }: { comic: StudioComic; onChange: (spots: AdSpot[]) => void }) {
  const chosen = adSpotsOf(comic);
  const full = chosen.length >= MAX_AD_SPOTS;

  const toggle = (spot: AdSpot) => {
    if (chosen.includes(spot)) onChange(chosen.filter((s) => s !== spot));
    else if (!full) onChange(AD_SPOTS.filter((s) => s === spot || chosen.includes(s)));
  };

  return (
    <section aria-labelledby="ad-spaces-title" className="mt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="ad-spaces-title" className="font-display text-3xl uppercase leading-none text-white">Ad spaces</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Pick where advertisers can buy a spot in every episode of this Mafiki. You&apos;re notified when one is interested and again when
            they pay.{" "}
            <Link href="/creator101/making-money" className="font-semibold text-mint hover:underline">How ad offers work</Link>
          </p>
        </div>
        {adSpotsAllowed(comic) && (
          <p className="text-sm font-semibold text-slate-300" aria-live="polite">
            <span className={full ? "text-sun" : "text-white"}>{chosen.length}</span> of {MAX_AD_SPOTS} picked
          </p>
        )}
      </div>

      {!adSpotsAllowed(comic) ? (
        <p className="flex items-start gap-3 border-2 border-dashed border-line px-4 py-5 text-sm leading-6 text-slate-300">
          <IoMegaphoneOutline className="mt-0.5 shrink-0 text-xl text-mint" />
          Ad spaces open once this Mafiki has {MILESTONE_EPISODES} published episodes. It has {publishedCount(comic)} so far.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label={`Ad spaces, pick up to ${MAX_AD_SPOTS}`}>
              {AD_SPOTS.map((spot) => {
                const on = chosen.includes(spot);
                const blocked = !on && full;
                return (
                  <button
                    key={spot}
                    type="button"
                    onClick={() => toggle(spot)}
                    aria-pressed={on}
                    aria-disabled={blocked}
                    title={blocked ? `You can pick up to ${MAX_AD_SPOTS}. Remove one to choose this.` : undefined}
                    className={`group flex flex-col border-2 p-2 text-left transition-colors sm:p-3 ${
                      on
                        ? "border-sun bg-sun/10 shadow-[4px_4px_0_#000]"
                        : blocked
                          ? "cursor-not-allowed border-line opacity-40"
                          : "border-line hover:border-white/60"
                    }`}
                  >
                    <MiniEpisode spots={[spot]} highlight={on} />
                    <span className="mt-2 flex items-center justify-between gap-1 sm:mt-3 sm:gap-2">
                      <span className="font-display text-lg uppercase leading-none text-white sm:text-xl">{AD_SPOT_LABEL[spot].name}</span>
                      <span
                        aria-hidden="true"
                        className={`flex h-5 w-5 items-center justify-center border-2 text-sm ${on ? "border-black bg-sun text-ink" : "border-line text-transparent"}`}
                      >
                        <IoCheckmark />
                      </span>
                    </span>
                    <span className="mt-1 text-[11px] leading-4 text-slate-400 sm:text-xs">{AD_SPOT_LABEL[spot].where}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {full
                ? `That's the most you can pick. Tap a chosen spot to remove it.`
                : chosen.length === 0
                  ? "No ad spaces yet: advertisers can't buy a spot on this Mafiki."
                  : `You can pick ${MAX_AD_SPOTS - chosen.length} more.`}
            </p>
          </div>

          <figure aria-label="Reader view of an episode with your ad spaces" className="mx-auto w-full max-w-[240px] border-2 border-line bg-panel p-3 lg:max-w-none">
            <figcaption className="mb-2 text-xs text-slate-400">Reader view of each episode</figcaption>
            <MiniEpisode spots={chosen} highlight labelled />
          </figure>
        </div>
      )}
    </section>
  );
}

// A sketch of an episode (two panels) with ad spaces at the given spots, like Creator 101's illustration.
function MiniEpisode({ spots, highlight, labelled = false }: { spots: AdSpot[]; highlight: boolean; labelled?: boolean }) {
  const ad = (spot: AdSpot) =>
    spots.includes(spot) && (
      <div
        className={`border-2 border-dashed px-1 py-1 text-center font-display text-[10px] uppercase leading-tight tracking-wide sm:px-2 sm:py-1.5 sm:text-xs ${
          highlight ? "border-sun bg-sun/10 text-sun" : "border-slate-500 text-slate-400"
        }`}
      >
        {labelled ? `Ad space · ${AD_SPOT_LABEL[spot].name}` : "Ad space"}
      </div>
    );
  const panel = <div className="flex aspect-[5/2] items-center justify-center bg-[#1e2a44] text-[11px] text-slate-500">Panel</div>;

  return (
    <div className="flex flex-col gap-1.5" aria-hidden="true">
      {ad("top")}
      {panel}
      {ad("middle")}
      {panel}
      {ad("bottom")}
    </div>
  );
}
