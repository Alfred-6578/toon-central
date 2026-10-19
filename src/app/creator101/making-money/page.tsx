import type { Metadata } from "next";
import Link from "next/link";
import { IoWarningOutline } from "react-icons/io5";
import { Creator101Shell, PUBLISH_HREF, SectionTitle, StepCard } from "@/components/creator101/Creator101Shell";
import { getSiteStats } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Making money · Creator 101 | Toon Central",
  description: "How creators earn on Toon Central: the Creator Rewards program, ad revenue sharing, Reader Ads and Reward Ads.",
};

// Copy follows the live Creator101 → Making money tab, with "series" said as "comic".
const REWARD_STEPS = [
  { title: "Earn from every 200 likes", body: "Once your comic reaches 1,000 likes in total, it becomes eligible for earnings." },
  {
    title: "Follow the creator guidelines",
    body: "Keep your content in line with our community and uploading rules, so Toon Central stays a safe and creative space.",
  },
  { title: "Be 18 or older", body: "Creators must be at least 18 (or the legal age in your country) to take part." },
  { title: "Apply for the Creator Rewards program", body: "Sign up through your creator dashboard and send in your application." },
  { title: "Switch on earnings for your comic", body: "Once you're approved, turn on earnings and start receiving rewards from your fans." },
];

const AD_STEPS = [
  { title: "Sign up as a creator", body: "Join the Ad Revenue Sharing program from your Toon Central creator dashboard." },
  { title: "Meet the minimum views", body: "Reach the monthly global page-view goal for Reader Ads or Reward Ads." },
  { title: "Apply for review", body: "Our team checks your eligibility and approves your account." },
];

// Wrapped: the global img { display: block } rule would override `hidden` on the img itself.
const coinArt = "pointer-events-none absolute bottom-0 hidden w-56 select-none sm:block lg:w-72";

// Creator 101 → Making money: the ways creators earn, and what each one needs.
export default async function MakingMoneyPage() {
  const stats = await getSiteStats();

  return (
    <Creator101Shell tab="money" stats={stats}>
      <section className="relative overflow-hidden border-b-[3px] border-black bg-[#5146e5]">
        <div className="dot-field absolute inset-0 opacity-25 [--dot-color:#fff]" aria-hidden="true" />
        <div className={`${coinArt} -left-4`}><img src="/creator-guide/coins-left.webp" alt="" /></div>
        <div className={`${coinArt} -right-4`}><img src="/creator-guide/coins-right.webp" alt="" /></div>
        <div className="relative mx-auto max-w-3xl px-6 py-14 text-center sm:py-16 lg:py-20">
          <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl lg:text-7xl">
            <span className="text-mint">Make money</span> with Toon Central
          </h1>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-white/85">
            Earn by sharing your story with a global audience. Creators can earn through the Creator Rewards program, the Ad Revenue
            Sharing program, and Patreon.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-20 px-6 py-14 md:px-8 lg:py-20">
        <section>
          <SectionTitle className="text-center">Creator Rewards: how to join</SectionTitle>
          <ol className="mt-12 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {REWARD_STEPS.map((step, i) => (
              <StepCard key={step.title} n={i + 1} title={step.title}>{step.body}</StepCard>
            ))}
          </ol>
        </section>

        <section className="border-[3px] border-black bg-panel p-6 shadow-[8px_8px_0_#000] sm:p-10">
          <div className="text-center">
            <span className="tag -rotate-2 bg-sun text-sm">Ad Revenue Sharing</span>
            <h2 className="mt-4 font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">
              Earn <span className="text-mint">50%</span> of the ads on your comics
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">Turn your views into income while your stories stay free for fans.</p>
          </div>
          <h3 className="mt-12 text-center font-bold uppercase tracking-[0.12em] text-slate-400">How to join</h3>
          <ol className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-3">
            {AD_STEPS.map((step, i) => (
              <StepCard key={step.title} n={i + 1} title={step.title}>{step.body}</StepCard>
            ))}
          </ol>
        </section>

        <section className="grid gap-10 md:grid-cols-2">
          <div>
            <SectionTitle>Reader Ads</SectionTitle>
            <p className="mt-4 leading-7 text-slate-300">
              Banner ads shown at the bottom of your episodes. Creators earn based on their comic&apos;s share of the total ad pool.
            </p>
            <h3 className="mt-8 font-bold uppercase tracking-[0.12em] text-slate-400">To qualify</h3>
            <ol className="mt-7 grid gap-y-8">
              <StepCard n={1}>Your comic has 1,000 subscribers or more.</StepCard>
              <StepCard n={2}>It reaches 40,000 global page views a month or more.</StepCard>
            </ol>
          </div>
          <div>
            <SectionTitle>Reward Ads</SectionTitle>
            <div className="mt-4 grid gap-3 leading-7 text-slate-300">
              <p>15–30 second video ads that readers can watch to unlock locked episodes of your comic.</p>
              <p>
                Because they&apos;re so engaging, they can earn 3–5× more than regular banner ads, depending on the advertiser and how your
                readers interact with the ad.
              </p>
              <p>If approved, you can lock up to three episodes behind Reward Ads at any one time.</p>
            </div>
            <h3 className="mt-8 font-bold uppercase tracking-[0.12em] text-slate-400">To qualify</h3>
            <ol className="mt-7 grid gap-y-8">
              <StepCard n={1}>You already qualify for Reader Ads.</StepCard>
              <StepCard n={2}>Your comic reaches 100,000 global page views a month or more.</StepCard>
            </ol>
            <p className="mt-6 flex gap-2 border-2 border-sun/60 bg-sun/10 p-3 text-sm text-sun">
              <IoWarningOutline className="mt-0.5 shrink-0 text-base" />
              Every episode using Reward Ads is reviewed and must be approved before it goes live.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl">
          <SectionTitle className="text-center">How Reward Ads earn</SectionTitle>
          <p className="mt-5 text-center leading-7 text-slate-300">
            Reward Ads pay you when readers choose to watch a 15–30 second video to unlock a locked episode. Earnings are based on ad
            impressions, not just on how many people read your comic.
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="border-2 border-line bg-panel p-5">
              <dt className="font-display text-2xl uppercase text-white">Page views</dt>
              <dd className="mt-1 text-sm text-slate-300">How many times your comic is read.</dd>
            </div>
            <div className="border-2 border-black bg-mint p-5 text-ink shadow-[4px_4px_0_#000]">
              <dt className="font-display text-2xl uppercase">Ad impressions</dt>
              <dd className="mt-1 text-sm font-medium text-ink/80">How many times an ad is actually shown to a reader. This is what pays.</dd>
            </div>
          </dl>
          <p className="mt-8 leading-7 text-slate-300">
            The more readers who watch the ad all the way through, the more you earn. On average, video ads are worth 3–5× more than
            banner ads, depending on advertiser demand and engagement. Your monthly earnings depend on:
          </p>
          <ul className="mt-3 grid gap-2 text-slate-300">
            <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-mint" />How many completed ad views your episodes get.</li>
            <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-mint" />Advertiser spending and the global ad market.</li>
          </ul>
          <p className="mt-6 text-sm text-slate-400">For the details, see the program terms and FAQ in your creator dashboard.</p>
          <div className="mt-10 flex justify-center">
            <Link href={PUBLISH_HREF} className="btn btn-primary px-6 py-3 text-base">Start sharing your story</Link>
          </div>
        </section>
      </div>
    </Creator101Shell>
  );
}
