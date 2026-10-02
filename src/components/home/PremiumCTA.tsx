import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import type { DesignChoice } from "@/lib/designOptions";
import { SubscribeCoupon } from "./subscribe/SubscribeCoupon";

export function PremiumCTA({ variant = "coupon" }: { variant?: DesignChoice<"subscribe"> }) {
  if (variant === "coupon") {
    return (
      <section id="subscribe" className="mb-12 mt-18">
        <RevealOnScroll className="block">
          <SubscribeCoupon />
        </RevealOnScroll>
      </section>
    );
  }

  return (
    <section id="subscribe" className="mt-18 mb-12 border-2 border-mint bg-panel p-5 sm:p-6 md:p-8">
      <RevealOnScroll className="block">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-4xl uppercase leading-none text-white sm:text-5xl md:text-6xl">
              Unlock the full library
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
              Premium titles, early chapters, and ad-free reading, all from{" "}
              <span className="font-bold text-mint">₦500/month</span>.
            </p>
          </div>

          <form className="flex w-full max-w-xl flex-col gap-4 max-lg:hidden sm:flex-row sm:items-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="h-12 flex-1 rounded-[3px] border-2 border-line bg-ink px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-mint"
            />
            <button type="submit" className="btn btn-primary h-12 px-6 text-base">
              Subscribe now
            </button>
          </form>
          <button className="btn btn-primary h-12 px-6 text-base lg:hidden">
            Subscribe now
          </button>
        </div>
      </RevealOnScroll>
    </section>
  );
}
