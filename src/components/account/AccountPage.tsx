import type { ReactNode } from "react";
import { Navigation } from "@/components/layout/Navigation";

// Frame for the signed-in pages (/me, /settings, /notifications): nav, a poster-type title, content.
export function AccountPage({ title, width = "max-w-6xl", children }: { title?: string; width?: string; children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <main className="relative pb-24 lg:pb-16">
        <Navigation />
        <div className="h-[66px]" />
        <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-80" />
        <div className={`relative mx-auto px-6 pt-10 md:px-8 lg:px-10 lg:pt-12 ${width}`}>
          {title && <h1 className="mb-8 font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl">{title}</h1>}
          {children}
        </div>
      </main>
    </div>
  );
}
