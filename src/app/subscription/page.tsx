import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { SubscriptionView } from "@/components/subscription/SubscriptionView";
import { getSiteStats } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Subscription | Toon Central",
  description: "Toon Central plans and passes: monthly plans with free credits, credit packs, and day or week passes that unlock every Mafiki.",
};

export default async function SubscriptionPage() {
  const stats = await getSiteStats();

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-96" />
      <main className="relative pb-24 lg:pb-0">
        <Navigation />
        <div className="h-[66px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-10 md:px-8 lg:px-10 lg:pt-14">
          <span className="tag -rotate-2 bg-sun text-sm">Subscription</span>
          <h1 className="mt-4 max-w-3xl font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl lg:text-8xl">
            Unlock the full library
          </h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Monthly plans from <span className="font-bold text-mint">₦950</span>, or unlock everything with a pass from{" "}
            <span className="font-bold text-mint">₦100 a day</span>.
          </p>

          <div className="mt-12">
            <SubscriptionView />
          </div>
        </div>

        <Footer stats={stats} />
      </main>

    </div>
  );
}
