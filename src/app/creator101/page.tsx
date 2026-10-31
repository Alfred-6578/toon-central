import type { Metadata } from "next";
import Link from "next/link";
import { IoCloudUploadOutline, IoColorPaletteOutline, IoArrowForward } from "react-icons/io5";
import { TbCoins } from "react-icons/tb";
import { Creator101Shell, PUBLISH_HREF, SectionTitle } from "@/components/creator101/Creator101Shell";
import { getCatalogue, getSiteStats } from "@/lib/api/client";
import { authHref } from "@/lib/auth";
import { cloudinary, comicHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "Creator 101 · Creator guide | Toon Central",
  description: "Everything you need to publish Mafiki on Toon Central: how it works, how to upload, and how creators make money.",
};

const FEATURES = [
  { icon: IoCloudUploadOutline, title: "Publish seamlessly", body: "Upload episodes in a few clicks with tools that make publishing quick and stress-free." },
  { icon: IoColorPaletteOutline, title: "Show your style", body: "Digital or traditional, in the Mafiki style or your own: your work gets the spotlight." },
  { icon: TbCoins, title: "Grow & earn", body: "Build fans, grow your readership, and get paid for your passion." },
];

const STEPS = [
  { art: "signup", title: "Sign up for free", body: "Join Toon Central in minutes: quick, easy, and no fees." },
  { art: "customize", title: "Customise your profile", body: "Add your name, bio and a profile picture so readers know who you are." },
  { art: "explore", title: "Explore the creator tools", body: "Get to know the upload dashboard, the style guides and the resources." },
  { art: "upload", title: "Upload your first episode", body: "Drag, drop and publish. No tech headaches." },
  { art: "share", title: "Share your work", body: "Post your link on social media, invite friends and reach new fans." },
  { art: "engage", title: "Engage & grow", body: "Reply to comments, join challenges, and switch on earnings." },
];

// Covers fanned like pages pinned to a wall: heights and offsets vary, the middle one leads.
const FAN = [
  "h-40 translate-y-6 -rotate-3 sm:h-52",
  "h-48 translate-y-1 rotate-2 sm:h-64",
  "h-44 translate-y-8 -rotate-1 sm:h-56",
  "h-56 -translate-y-2 rotate-0 sm:h-72",
  "h-44 translate-y-5 rotate-2 sm:h-60",
  "h-48 translate-y-0 -rotate-2 sm:h-64",
  "h-40 translate-y-7 rotate-3 sm:h-52",
];

// Creator 101 → Introduction: what Toon Central is for creators, and the six steps to a first episode.
export default async function Creator101IntroPage() {
  const [catalogue, stats] = await Promise.all([getCatalogue(), getSiteStats()]);
  const covers = [...catalogue].filter((c) => c.coverImage).sort((a, b) => b.views - a.views).slice(0, FAN.length);

  return (
    <Creator101Shell tab="intro" stats={stats}>
      {/* Hero: the pitch over a fan of real covers. */}
      <section className="relative overflow-hidden border-b-2 border-line">
        <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-96" />
        <div className="relative mx-auto max-w-7xl px-6 pt-12 text-center md:px-8 lg:px-10 lg:pt-16">
          <span className="tag -rotate-2 bg-sun text-sm">Share without limits</span>
          <h1 className="mx-auto mt-4 max-w-4xl font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl lg:text-8xl">
            Endless Mafiki, endless stories
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">Read anywhere. Create anytime. Start here to bring your Mafiki to readers everywhere.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href={authHref("signup", "/creator101")} className="btn btn-primary px-6 py-3 text-base">Get started</Link>
            <Link href={PUBLISH_HREF} className="btn btn-ghost px-6 py-3 text-base">Publish</Link>
          </div>

          <ul className="mx-auto mt-12 flex max-w-5xl items-end justify-center gap-2 overflow-hidden pb-10 sm:gap-4" aria-label="Mafiki on Toon Central">
            {covers.map((comic, i) => (
              <li key={comic.uuid} className={`shrink-0 ${i === 0 || i === FAN.length - 1 ? "hidden sm:block" : ""}`}>
                <Link
                  href={comicHref(comic.uuid)}
                  className={`block aspect-[3/4] overflow-hidden border-[3px] border-black shadow-[5px_5px_0_#000] transition-transform hover:-translate-y-2 ${FAN[i]}`}
                >
                  <img src={cloudinary(comic.coverImage, 500)} alt={comic.title} className="h-full w-full object-cover" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What it's about + three reasons. */}
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
          <div>
            <SectionTitle>What Toon Central is all about</SectionTitle>
            <p className="mt-5 leading-7 text-slate-300">
              Toon Central is your gateway into the vibrant world of Mafiki. Whether you&apos;re here to dive into captivating stories,
              connect with passionate creators, or share your own work with the world, we&apos;ve built a space where every panel comes
              alive. From epic adventures and heartwarming romances to thrilling mysteries and laugh-out-loud comedies, there&apos;s
              something for every Mafiki lover.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className={`border-2 border-black bg-panel p-5 shadow-[5px_5px_0_#000] ${i === 1 ? "sm:translate-y-6" : ""}`}>
                <span className="flex h-11 w-11 items-center justify-center border-2 border-black bg-mint text-2xl text-ink">
                  <Icon />
                </span>
                <h3 className="mt-5 font-display text-2xl uppercase leading-none text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The green band into Making money. */}
      <section className="relative overflow-hidden border-y-[3px] border-black bg-mint text-ink">
        <div className="absolute -left-10 bottom-0 h-full w-1/3 -skew-x-12 bg-mint-deep/25" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-6 py-10 md:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-10 lg:py-12">
          <div>
            <h2 className="font-display text-4xl uppercase leading-[0.95] sm:text-5xl">Making money on Toon Central</h2>
            <p className="mt-3 max-w-2xl font-medium text-ink/80">
              Publish your work instantly and connect with a global audience. No gatekeepers: your stories deserve to be seen, and paid for.
            </p>
          </div>
          <Link href="/creator101/making-money" className="btn w-fit gap-2 border-black bg-ink px-6 py-3 text-base text-white shadow-[4px_4px_0_#000] hover:-translate-y-px">
            Learn more <IoArrowForward />
          </Link>
        </div>
      </section>

      {/* Six steps, with the live site's illustrations. */}
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-8 lg:px-10 lg:py-20">
        <SectionTitle className="text-center" highlight="easy steps">
          Start your story in 6
        </SectionTitle>
        <ol className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(({ art, title, body }, i) => (
            <li key={title} className="flex flex-col items-center text-center">
              <div className="relative flex h-40 w-full items-center justify-center">
                <span className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/10" aria-hidden="true" />
                <img src={`/creator-guide/${art}.svg`} alt="" loading="lazy" className="relative max-h-40 w-auto" />
              </div>
              <p className="mt-5 font-display text-lg text-mint">Step {i + 1}</p>
              <h3 className="font-display text-2xl uppercase leading-none text-white">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 flex flex-wrap justify-center gap-3">
          <Link href="/creator101/uploading" className="btn btn-ghost gap-2 px-6 py-3 text-base">
            Read the uploading guide <IoArrowForward />
          </Link>
        </div>
      </section>
    </Creator101Shell>
  );
}
