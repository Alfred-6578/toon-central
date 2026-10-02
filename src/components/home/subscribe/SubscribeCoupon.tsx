"use client";

import { IoBanOutline, IoCutOutline, IoDiamondOutline, IoFlashOutline, IoWalletOutline } from "react-icons/io5";
import { Avatar } from "@/components/layout/nav/Menus";
import { useMockSession, type MockUser } from "@/lib/mockSession";

// The live site's own pitch: "Premium titles, early chapters, and ad-free reading - all from ₦500/month."
const benefits = [
  { icon: IoDiamondOutline, label: "Premium titles" },
  { icon: IoFlashOutline, label: "Early chapters" },
  { icon: IoBanOutline, label: "Ad-free reading" },
];

// Perforation notches where the stub tears off: half-circles punched out of the dashed edge.
function Notches() {
  return (
    <>
      <span aria-hidden="true" className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full border-2 border-dashed border-paper/50 bg-ink md:block" />
      <span aria-hidden="true" className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full border-2 border-dashed border-paper/50 bg-ink md:block" />
    </>
  );
}

// Back-page mail-in coupon, like the ads in printed comics: dashed "cut here" border and a price stub.
function Coupon() {
  return (
    <div className="relative">
      <span className="absolute -top-3 left-6 z-10 flex items-center gap-1.5 bg-ink px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <IoCutOutline className="text-base" /> Cut here
      </span>

      <div className="grid border-2 border-dashed border-paper/50 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="p-6 sm:p-8">
          <span className="tag -rotate-2 bg-sun text-sm">Toon Central Premium</span>
          <h2 className="mt-4 font-display text-4xl uppercase leading-none text-white sm:text-5xl md:text-6xl">
            Unlock the full library
          </h2>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            {benefits.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 font-semibold text-slate-200">
                <span className="flex h-9 w-9 items-center justify-center border-2 border-black bg-mint text-lg text-ink">
                  <Icon />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-col items-center justify-center gap-1 border-t-2 border-dashed border-paper/50 bg-paper p-6 text-center text-ink md:w-72 md:border-l-2 md:border-t-0">
          <Notches />
          <p className="text-xs font-bold uppercase tracking-wide text-ink/60">From</p>
          <p className="font-display text-7xl leading-none">₦500</p>
          <p className="font-display text-xl uppercase leading-none">per month</p>
          <a href="/subscription" className="btn btn-primary mt-5 w-full px-6 py-3 text-base">Subscribe</a>
        </div>
      </div>
    </div>
  );
}

// Already paying? No pitch: a member card with renewal date and credits instead.
function MemberCard({ user }: { user: MockUser }) {
  const firstName = user.name.split(" ")[0];

  return (
    <div className="grid border-2 border-mint bg-panel md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <Avatar user={user} className="h-16 w-16 text-2xl" />
        <div>
          <span className="tag bg-mint">Premium member</span>
          <h2 className="mt-3 font-display text-4xl uppercase leading-none text-white sm:text-5xl">You&apos;re all set, {firstName}</h2>
          <p className="mt-2 text-slate-300">Premium titles, early chapters and ad-free reading are unlocked.</p>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-1 border-t-2 border-black bg-mint p-6 text-ink md:w-72 md:border-l-2 md:border-t-0">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/60">Renews</p>
        <p className="font-display text-4xl uppercase leading-none">{user.plan.renews}</p>
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold">
          <IoWalletOutline className="text-base" /> {user.credits.toLocaleString()} credits
        </p>
        <a href="/subscription" className="btn mt-4 border-black bg-ink px-5 py-2.5 text-white hover:bg-black">
          Manage subscription
        </a>
      </div>
    </div>
  );
}

export function SubscribeCoupon() {
  const { user } = useMockSession();
  return user?.plan.tier === "Premium" ? <MemberCard user={user} /> : <Coupon />;
}
