import type { Metadata } from "next";
import Link from "next/link";
import { IoArrowForward, IoPhonePortraitOutline, IoEarthOutline, IoLayersOutline, IoSwapVerticalOutline } from "react-icons/io5";
import { MilestonesShell, PUBLISH_HREF, SectionTitle } from "@/components/milestones/MilestonesShell";
import { getOriginalsPageData, getSiteStats } from "@/lib/api/client";
import { cloudinary, comicHref, formatCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mafiki · Milestones | Toon Central",
  description: "The Mafiki format: vertical-scroll comics made for phones, told in episodes, rooted in African stories.",
};

// Draft copy: the live tab says "coming soon" and there's no design for it yet.
const TRAITS = [
  { icon: IoSwapVerticalOutline, title: "Made to scroll", body: "One long vertical strip per episode. Readers scroll down, never across, so panels stack top to bottom." },
  { icon: IoPhonePortraitOutline, title: "Made for phones", body: "Draw on a canvas 800 pixels wide, with text big enough to read on a small screen without zooming." },
  { icon: IoLayersOutline, title: "Told in episodes", body: "Stories come out an episode at a time. Every episode should end with a reason to read the next one." },
  { icon: IoEarthOutline, title: "Rooted in Africa", body: "Our cities, myths, languages and humour, from creators across the continent, for readers everywhere." },
];

// Milestones → Mafiki: what the format asks of a creator, with Toon Central Originals as the examples.
export default async function MafikiPage() {
  const [originals, stats] = await Promise.all([getOriginalsPageData("popular"), getSiteStats()]);
  const examples = originals.comics.slice(0, 6);

  return (
    <MilestonesShell tab="mafiki" stats={stats}>
      <section className="relative overflow-hidden border-b-2 border-line">
        <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-96" />
        <div className="relative mx-auto max-w-7xl px-6 py-14 md:px-8 lg:px-10 lg:py-20">
          <span className="tag -rotate-2 bg-sun text-sm">The format</span>
          <h1 className="mt-4 max-w-4xl font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl lg:text-8xl">Make a Mafiki</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Every comic on Toon Central is a Mafiki: a vertical-scroll comic, read on a phone, one episode at a time. Here&apos;s what that
            means for how you draw and publish.
          </p>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRAITS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="border-2 border-black bg-panel p-5 shadow-[5px_5px_0_#000]">
                <span className="flex h-11 w-11 items-center justify-center border-2 border-black bg-mint text-2xl text-ink">
                  <Icon />
                </span>
                <h2 className="mt-5 font-display text-2xl uppercase leading-none text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 md:px-8 lg:px-10 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionTitle>Learn from the Originals</SectionTitle>
            <p className="mt-3 text-slate-300">Read a few episodes of these with a creator&apos;s eye: panel flow, pacing, and where each episode stops.</p>
          </div>
          <Link href="/originals" className="flex items-center gap-1.5 text-sm font-semibold text-mint hover:underline">
            All Originals <IoArrowForward />
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {examples.map((comic) => (
            <li key={comic.uuid}>
              <Link href={comicHref(comic.uuid)} className="group block">
                <span className="block aspect-[3/4] overflow-hidden border-2 border-black shadow-[4px_4px_0_#000]">
                  <img src={cloudinary(comic.coverImage, 500)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </span>
                <span className="mt-2 block truncate font-display text-xl uppercase leading-tight text-white group-hover:text-mint">{comic.title}</span>
                <span className="block text-xs text-slate-400">{formatCount(comic.views)} reads</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:px-8 lg:px-10">
        <div className="grid gap-6 border-[3px] border-black bg-mint p-6 text-ink shadow-[8px_8px_0_#000] sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h2 className="font-display text-4xl uppercase leading-[0.95]">Ready to draw yours?</h2>
            <p className="mt-2 font-medium text-ink/80">The uploading guide covers panel placement, speech bubbles, fonts, sizes and pacing, with examples.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/milestones/uploading" className="btn gap-2 border-black bg-ink px-6 py-3 text-base text-white shadow-[4px_4px_0_#000]">
              Uploading guide <IoArrowForward />
            </Link>
            <Link href={PUBLISH_HREF} className="btn border-black bg-paper px-6 py-3 text-base text-ink shadow-[4px_4px_0_#000]">Publish</Link>
          </div>
        </div>
      </section>
    </MilestonesShell>
  );
}
