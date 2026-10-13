"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IoCheckmark, IoClose, IoCutOutline, IoWalletOutline } from "react-icons/io5";
import { authHref } from "@/lib/auth";
import { useHydrated, useMockSession } from "@/lib/mockSession";
import { CREDIT_PACKS, naira, PASS_TERMS, PASSES, PLANS, type CreditPack, type Plan } from "@/data/subscription";

type Item = { kind: "plan"; plan: Plan } | { kind: "credits"; pack: CreditPack };

const periodLabel = (plan: Plan) => `per ${plan.period}`;

// /subscription, laid out like the live page: monthly plans, credit packs, then the day/week passes.
// Plans are cut-out coupons (as on the homepage). Payments aren't connected in this preview; the
// checkout panel says so.
export function SubscriptionView() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const { user } = useMockSession();
  const [checkout, setCheckout] = useState<Item | null>(null);

  const signedIn = hydrated && !!user;
  // The reader's current tier (the mock account is on Premium); signed out, nothing is current.
  const currentId = signedIn ? user!.plan.tier.toLowerCase() : null;

  return (
    <>
      {signedIn && (
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-2 border-mint bg-panel px-5 py-4">
          <p className="text-sm text-slate-200">
            <span className="tag mr-2 bg-mint">{user!.plan.tier}</span>
            {user!.plan.renews ? (
              <>
                Renews <span className="font-semibold text-white">{user!.plan.renews}</span>.
              </>
            ) : (
              "You're on the free plan."
            )}
          </p>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <IoWalletOutline className="text-mint" /> {user!.credits.toLocaleString()} credits
          </p>
        </div>
      )}

      <section aria-labelledby="plans-title">
        <SectionTitle id="plans-title" title="Monthly plans" note="Every paid plan comes with free credits each month" />
        <ul className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <li key={plan.id}>
              <PlanCoupon
                plan={plan}
                current={currentId === plan.id}
                action={
                  plan.price === 0
                    ? signedIn
                      ? null
                      : { label: "Join free", href: authHref("signup", pathname) }
                    : { label: `Choose ${plan.name}`, onClick: () => setCheckout({ kind: "plan", plan }) }
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <section id="credits" aria-labelledby="credits-title" className="mt-16 scroll-mt-24">
        <SectionTitle
          id="credits-title"
          title="Buy credits"
          note={signedIn ? `Balance: ${user!.credits.toLocaleString()} credits` : "₦5 per credit"}
        />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CREDIT_PACKS.map((pack) => (
            <li key={pack.id}>
              <button
                type="button"
                onClick={() => setCheckout({ kind: "credits", pack })}
                className="group flex h-full w-full flex-col items-start border-2 border-line bg-panel p-4 text-left transition-colors hover:border-mint"
              >
                <span className="flex items-center gap-2 font-display text-4xl leading-none text-white">
                  <IoWalletOutline className="text-2xl text-mint" /> {pack.credits.toLocaleString()}
                </span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">credits</span>
                <span className="mt-auto flex w-full items-center justify-between gap-2 pt-5">
                  <span className="font-display text-2xl text-white">{naira(pack.price)}</span>
                  <span className="text-sm font-bold text-mint group-hover:underline">Buy →</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Same anchor the live site uses (/subscription#special-offers). */}
      <section id="special-offers" aria-labelledby="passes-title" className="mt-16 scroll-mt-24">
        <SectionTitle id="passes-title" title="Special offers" note="Short passes that unlock everything" />
        <ul className="grid max-w-4xl gap-8 md:grid-cols-2">
          {PASSES.map((pass) => (
            <li key={pass.id}>
              <PlanCoupon
                plan={pass}
                terms={PASS_TERMS(pass.period)}
                action={{ label: `Get ${pass.name}`, onClick: () => setCheckout({ kind: "plan", plan: pass }) }}
              />
            </li>
          ))}
        </ul>
      </section>

      {checkout && (
        <CheckoutSheet item={checkout} signedIn={signedIn} signInHref={authHref("signup", pathname)} onClose={() => setCheckout(null)} />
      )}
    </>
  );
}

function SectionTitle({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b-2 border-line pb-3">
      <h2 id={id} className="font-display text-3xl uppercase leading-none text-white sm:text-4xl">{title}</h2>
      <p className="pb-0.5 text-sm text-slate-400">{note}</p>
    </div>
  );
}

type Action = { label: string; href?: string; onClick?: () => void } | null;

function PlanCoupon({ plan, current = false, terms, action }: { plan: Plan; current?: boolean; terms?: string; action: Action }) {
  const highlighted = Boolean(plan.badge) || current;

  return (
    <div className="relative h-full">
      <span className="absolute -top-3 left-5 z-10 flex items-center gap-1.5 bg-ink px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <IoCutOutline className="text-base" /> Cut here
      </span>
      {plan.badge && <span className="tag absolute -top-3 right-4 z-10 -rotate-2 bg-sun">{plan.badge}</span>}

      <div className={`flex h-full flex-col border-2 border-dashed ${highlighted ? "border-mint" : "border-paper/50"}`}>
        {/* Price stub */}
        <div className="flex flex-col items-center gap-1 border-b-2 border-dashed border-paper/50 bg-paper px-4 pb-4 pt-5 text-center text-ink">
          <p className="font-display text-xl uppercase leading-none">{plan.name}</p>
          <p className="mt-1 font-display text-5xl leading-none sm:text-6xl">{naira(plan.price)}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-ink/60">{periodLabel(plan)}</p>
          {current ? (
            <span className="btn mt-3 w-full cursor-default border-black bg-ink px-5 py-2.5 text-sm text-white">Your plan</span>
          ) : action?.href ? (
            <Link href={action.href} className="btn btn-primary mt-3 w-full px-5 py-2.5 text-sm">{action.label}</Link>
          ) : action ? (
            <button type="button" onClick={action.onClick} className="btn btn-primary mt-3 w-full px-5 py-2.5 text-sm">{action.label}</button>
          ) : null}
        </div>

        <div className="flex-1 p-4 sm:p-5">
          {plan.blurb && <p className="mb-3 text-sm text-slate-400">{plan.blurb}</p>}
          <ul className="grid gap-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-200">
                <IoCheckmark className="mt-0.5 shrink-0 text-base text-mint" /> {feature}
              </li>
            ))}
          </ul>
          {terms && <p className="mt-4 border-t-2 border-line pt-3 text-xs leading-5 text-slate-400">{terms}</p>}
        </div>
      </div>
    </div>
  );
}

function CheckoutSheet({ item, signedIn, signInHref, onClose }: { item: Item; signedIn: boolean; signInHref: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = item.kind === "plan" ? item.plan.name : `${item.pack.credits.toLocaleString()} credits`;
  const detail = item.kind === "plan" ? `${naira(item.plan.price)} ${periodLabel(item.plan)}` : naira(item.pack.price);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div className="sheet-in relative w-full max-w-md border-[3px] border-black bg-ink p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-[8px_8px_0_#000] sm:pb-6">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-white">
          <IoClose />
        </button>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Checkout</p>
        <h2 id="checkout-title" className="mt-1 font-display text-4xl uppercase leading-none text-white">{title}</h2>
        <p className="mt-2 font-semibold text-mint">{detail}</p>

        {signedIn ? (
          <>
            <p className="mt-6 border-2 border-dashed border-line px-4 py-3 text-sm leading-6 text-slate-400">
              Payments aren&apos;t connected in this preview, so nothing is charged. Checkout opens here once payments are
              connected.
            </p>
            <button type="button" onClick={onClose} className="btn btn-primary mt-6 w-full px-6 py-3 text-base">Got it</button>
          </>
        ) : (
          <>
            <p className="mt-6 text-sm leading-6 text-slate-300">Join free or sign in first, then come back here to finish.</p>
            <Link href={signInHref} className="btn btn-primary mt-6 w-full px-6 py-3 text-base">Join to continue</Link>
          </>
        )}
      </div>
    </div>
  );
}
