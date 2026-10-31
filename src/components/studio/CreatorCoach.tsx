"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoArrowForward, IoSparkles } from "react-icons/io5";
import { findTourTarget, TourSpot } from "@/components/ui/TourSpot";
import { NOTICE_COPY, STEPS, useCreatorTutorial, type StepSpec } from "@/lib/creatorTutorial";
import { useHydrated } from "@/lib/mockSession";
import type { StudioMode } from "@/lib/studioModel";

// The creator tutorial across every Studio page: the welcome, first-Mafiki and milestone cards, and the
// current step pointing at its control (or docked in the corner with "Take me there" when the control
// is on another page). The page stays usable throughout, so creators do each step for real.
export function CreatorCoach({ mode }: { mode: StudioMode }) {
  const hydrated = useHydrated();
  const t = useCreatorTutorial(mode);
  const { state } = t;
  if (!hydrated) return null;

  if (state.phase === "welcome") {
    return (
      <Notice
        eyebrow="Welcome"
        {...NOTICE_COPY.welcome}
        primary={{ label: "Start tutorial", onClick: t.start }}
        secondary={{ label: "Maybe later", onClick: t.later }}
      />
    );
  }
  if (state.firstMafiki === "pending") {
    return (
      <Notice
        eyebrow="First Mafiki"
        {...NOTICE_COPY.firstMafiki}
        primary={{ label: "Continue tutorial", onClick: t.continueAfterFirst }}
        secondary={{ label: "Later", onClick: t.dismissFirst }}
      />
    );
  }
  if (state.milestone === "pending") {
    return (
      <Notice
        eyebrow="Milestone"
        {...NOTICE_COPY.milestone}
        primary={{ label: "Monetize my next Mafiki", onClick: t.startMonetize, href: t.href("/creator/comics/new") }}
        secondary={{ label: "Later", onClick: t.dismissMilestone }}
      />
    );
  }

  const step =
    state.monetize === "on"
      ? STEPS.find((s) => s.step === state.monetizeStep)
      : state.phase === "steps"
        ? STEPS.find((s) => s.step === state.step)
        : undefined;
  if (!step) return null;

  const monetizing = step.step >= 6;
  const range = monetizing ? STEPS.filter((s) => s.step >= 6) : STEPS.filter((s) => s.step <= 5);
  const position = range.indexOf(step);
  const last = position === range.length - 1;
  const following = range[position + 1];

  return (
    <StepCard
      key={step.step}
      spec={step}
      label={`${monetizing ? "Monetization" : "Tutorial"} · step ${position + 1} of ${range.length}`}
      href={step.href ? t.href(step.href(state)) : null}
      nextHref={following?.step === 3 && following.href ? t.href(following.href(state)) : null}
      onBack={position > 0 ? () => t.goTo(range[position - 1].step) : null}
      onNext={() => (last ? (monetizing ? t.finishMonetize() : t.finishSteps()) : t.goTo(following.step))}
      onSkip={monetizing ? t.finishMonetize : t.later}
      last={last}
    />
  );
}

type Action = { label: string; onClick: () => void; href?: string };

// A/B/C: a small dismissible card in the corner, filed in the bell as well.
function Notice({ eyebrow, title, body, primary, secondary }: { eyebrow: string; title: string; body: string; primary: Action; secondary: Action }) {
  const router = useRouter();
  return (
    <TourSpot rect={null} labelledBy="coach-notice-title">
      <div className="dot-field pointer-events-none absolute inset-x-0 top-0 h-16 opacity-40 [--dot-color:var(--color-mint-deep)]" aria-hidden="true" />
      <p className="relative flex items-center gap-1.5 font-display text-xs uppercase tracking-widest text-mint-deep">
        <IoSparkles /> {eyebrow}
      </p>
      <h2 id="coach-notice-title" className="relative mt-1 font-display text-3xl uppercase leading-[0.95]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            primary.onClick();
            if (primary.href) router.push(primary.href);
          }}
          className="flex items-center gap-1.5 border-2 border-black bg-mint px-4 py-1.5 text-sm font-bold shadow-[3px_3px_0_#000] hover:bg-white"
        >
          {primary.label} <IoArrowForward />
        </button>
        <button type="button" onClick={secondary.onClick} className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-ink">
          {secondary.label}
        </button>
      </div>
    </TourSpot>
  );
}

type StepCardProps = {
  spec: StepSpec;
  label: string;
  // Where the step's control lives (null: explained in the card), and where "Next" goes when the next
  // step is on another page.
  href: string | null;
  nextHref: string | null;
  onBack: (() => void) | null;
  onNext: () => void;
  onSkip: () => void;
  last: boolean;
};

function StepCard({ spec, label, href, nextHref, onBack, onNext, onSkip, last }: StepCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const scrolled = useRef(false);

  // Follow the control as the page scrolls, resizes or changes (uploads, forms growing).
  useEffect(() => {
    const read = () => {
      const next = findTourTarget(spec.target);
      if (next && !scrolled.current && (next.top < 70 || next.bottom > window.innerHeight)) {
        scrolled.current = true;
        // Tall targets (a whole form) from their top, under the site nav; small ones centred.
        if (next.height > window.innerHeight * 0.5) window.scrollTo({ top: window.scrollY + next.top - 96, behavior: "smooth" });
        else document.querySelector(`[data-tour="${spec.target}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      setRect((prev) =>
        prev && next && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height ? prev : next
      );
    };
    read();
    const timer = setInterval(read, 250);
    return () => clearInterval(timer);
  }, [spec.target, pathname]);

  const here = href === null || pathname === href.split("?")[0];

  return (
    <TourSpot rect={rect} labelledBy="coach-step-title">
      <p className="font-display text-xs uppercase tracking-widest text-mint-deep">{label}</p>
      <h2 id="coach-step-title" className="mt-1 font-display text-2xl uppercase leading-none">{spec.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{spec.body}</p>
      {!rect && spec.step === 7 && (
        <p className="mt-2 text-xs text-slate-500">
          You&apos;ll find the key on the page thumbnails when you edit episode 4 or later of a Mafiki that earns with credits.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={onSkip} className="mr-auto text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-ink">
          {last ? "Close" : "Skip"}
        </button>
        {onBack && (
          <button type="button" onClick={onBack} className="border-2 border-ink px-3 py-1.5 text-sm font-bold hover:bg-ink hover:text-white">
            Back
          </button>
        )}
        {!rect && !here ? (
          <button
            type="button"
            onClick={() => href && router.push(href)}
            className="border-2 border-black bg-mint px-4 py-1.5 text-sm font-bold shadow-[3px_3px_0_#000] hover:bg-white"
          >
            Take me there
          </button>
        ) : spec.next ? (
          <button
            type="button"
            onClick={() => {
              onNext();
              if (nextHref) router.push(nextHref);
            }}
            className="border-2 border-black bg-mint px-4 py-1.5 text-sm font-bold shadow-[3px_3px_0_#000] hover:bg-white"
          >
            {last ? "Done" : "Next"}
          </button>
        ) : (
          <span className="text-xs font-semibold text-slate-500">Create it to continue</span>
        )}
      </div>
    </TourSpot>
  );
}
