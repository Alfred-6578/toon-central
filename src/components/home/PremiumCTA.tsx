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
              Every locked chapter, every comic and ad-free reading, from{" "}
              <span className="font-bold text-mint">₦100 a day</span>.
            </p>
          </div>

          {/* Was an email field that went nowhere ("Subscribe" means Premium here, not a newsletter). */}
          <a href="/subscription" className="btn btn-primary h-12 shrink-0 px-8 text-base">
            Subscribe now
          </a>
        </div>
      </RevealOnScroll>
    </section>
  );
}
