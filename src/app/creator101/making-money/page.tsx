import type { Metadata } from "next";
import Link from "next/link";
import { IoArrowForward, IoNotificationsOutline, IoTrophyOutline } from "react-icons/io5";
import { Creator101Shell, SectionTitle } from "@/components/creator101/Creator101Shell";
import { getSiteStats } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Making money · Creator 101 | Toon Central",
  description: "How creators earn on Toon Central: on-site ads, panel unlocks, ad offers, credit points, Creator Rewards and Creator of the Month.",
};

// Copy and layout from the client's "How to Make Money on Toon Central" guide (doc + PDF, Oct 2026).
// Rates and rules marked "proposed" or still open in that guide are shown as the guide shows them.

const WAYS = [
  {
    title: "On-site ads",
    body: "Earn per click when readers interact with the ads on your Mafiki. The more people interact, the more you stand to make.",
    chip: "Unlocks at 4 chapters",
  },
  {
    title: "Panel by panel",
    body: "Lock any panel of your work. Fans can pay for the complete work or unlock it one panel at a time, through small micro-transactions.",
    chip: "Micro-transactions",
  },
  {
    title: "Ad offers",
    body: "From your Creator Studio, place ad offers in chosen spots on a Mafiki you've already uploaded. Advertisers click an offer, see the price and pay to run their ad there.",
    chip: "You choose the spots",
  },
  {
    title: "Credit points",
    body: "Lock the full Mafiki and let readers unlock it with credit points. Every Mafiki unlocks for a flat 1,500 credits. This option replaces ads and micro-transactions on that Mafiki.",
    chip: "Unlocks at 4 chapters, from chapter 5",
  },
];

const AD_OFFER_STEPS = [
  { title: "Place your offer.", body: "In your Creator Studio, mark the spots on an uploaded Mafiki where ads can go." },
  { title: "An advertiser clicks it.", body: "They go to a payment flow that shows exactly what it costs to put their ad there. You get a notification." },
  { title: "They pay.", body: "You get a second notification when the payment goes through, and the ad goes live on your Mafiki." },
];

// $0.50 per 10,000 eligible views (the guide's proposed rate).
const RATE_PER_10K = 0.5;
const usd = (views: number) => `$${((views / 10_000) * RATE_PER_10K).toFixed(2)}`;
const RATE_ROWS = [10_000, 50_000, 100_000, 500_000, 1_000_000];
const EXAMPLE_VIDEOS = [100_000, 200_000, 50_000, 500_000, 150_000];

const coinArt = "pointer-events-none absolute bottom-0 hidden w-56 select-none sm:block lg:w-72";

// Creator 101 → Making money: the four ways to earn on a comic, then Creator Rewards and Creator of the Month.
export default async function MakingMoneyPage() {
  const stats = await getSiteStats();
  const exampleTotal = EXAMPLE_VIDEOS.reduce((sum, v) => sum + v, 0);

  return (
    <Creator101Shell tab="money" stats={stats} signOff={false}>
      <section className="relative overflow-hidden border-b-[3px] border-black bg-[#5146e5]">
        <div className="dot-field absolute inset-0 opacity-25 [--dot-color:#fff]" aria-hidden="true" />
        {/* Wrapped: the global img { display: block } rule would override `hidden` on the img itself. */}
        <div className={`${coinArt} -left-4`}><img src="/creator-guide/coins-left.webp" alt="" /></div>
        <div className={`${coinArt} -right-4`}><img src="/creator-guide/coins-right.webp" alt="" /></div>
        <div className="relative mx-auto max-w-3xl px-6 py-14 text-center sm:py-16 lg:py-20">
          <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl lg:text-7xl">
            Make money with <span className="text-sun">Toon Central</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-white/85">
            Earn from the stories you tell. Choose how you want to be paid: ads, panel unlocks, credit points or Creator Rewards.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-24 px-6 py-14 md:px-8 lg:py-20">
        {/* Four ways to earn */}
        <section>
          <div className="text-center">
            <SectionTitle>Four ways to earn on your Mafiki</SectionTitle>
            <p className="mt-3 text-slate-300">Pick what suits your story. Some options unlock as your Mafiki grows.</p>
          </div>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2">
            {WAYS.map((way, i) => (
              <li key={way.title} className="flex flex-col border-2 border-black bg-panel p-5 shadow-[5px_5px_0_#000] sm:p-6">
                <h3 className="flex items-center gap-3 font-display text-3xl uppercase leading-none text-white">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-mint text-xl text-ink">{i + 1}</span>
                  {way.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{way.body}</p>
                <span className="mt-4 w-fit border border-mint/60 px-2.5 py-1 text-xs font-semibold text-mint">{way.chip}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* How ad offers work */}
        <section>
          <SectionTitle className="text-center">How ad offers work</SectionTitle>
          <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
            <figure className="border-2 border-line bg-panel p-4" aria-label="A reader's view of a Mafiki with an ad offer between two panels">
              <figcaption className="mb-3 text-xs text-slate-400">Reader view of your Mafiki</figcaption>
              <div className="flex aspect-[5/2] items-center justify-center bg-[#1e2a44] text-sm text-slate-400">Mafiki panel</div>
              <div className="my-3 border-2 border-dashed border-sun bg-sun/10 px-4 py-4 text-center font-display text-xl uppercase tracking-wide text-sun">
                Place your ads here
              </div>
              <div className="flex aspect-[5/2] items-center justify-center bg-[#1e2a44] text-sm text-slate-400">Mafiki panel</div>
            </figure>
            <ol className="grid gap-5">
              {AD_OFFER_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-mint font-display text-xl text-ink">{i + 1}</span>
                  <p className="leading-7 text-slate-300">
                    <span className="font-bold text-white">{step.title}</span> {step.body}
                  </p>
                </li>
              ))}
              <li className="flex items-start gap-2 border-l-2 border-mint pl-4 text-sm text-slate-400">
                <IoNotificationsOutline className="mt-0.5 shrink-0 text-base text-mint" />
                You&apos;re notified at both stages, so you always know when there&apos;s interest in a spot and when it&apos;s been paid for.
              </li>
            </ol>
          </div>
        </section>

        {/* Creator Rewards */}
        <section>
          <div className="mx-auto max-w-3xl text-center">
            <SectionTitle>Toon Central Creator Rewards</SectionTitle>
            <p className="mt-3 font-display text-2xl uppercase text-sun">Your stories. Your audience. Your earnings.</p>
            <p className="mt-4 leading-7 text-slate-300">
              African Mafiki artists and animators should earn from the stories they create and the audiences they build. Creator Rewards
              pays you for the eligible views on your Mafiki, chapters and animated videos.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="border-2 border-black bg-panel p-5 shadow-[5px_5px_0_#000] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Proposed reward rate</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-6xl leading-none text-white">$0.50</span>
                <span className="text-sm font-semibold text-slate-300">per 10,000 eligible views</span>
              </p>
              <table className="mt-5 w-full text-sm">
                <caption className="sr-only">Rewards by eligible views</caption>
                <tbody className="divide-y-2 divide-line border-t-2 border-line">
                  {RATE_ROWS.map((views) => (
                    <tr key={views}>
                      <th scope="row" className="py-2.5 text-left font-normal text-slate-200">{views.toLocaleString("en-US")} views</th>
                      <td className="py-2.5 text-right font-bold text-mint">{usd(views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-slate-500">Figures assume every view qualifies under the programme rules.</p>
            </div>

            <div className="border-2 border-black bg-panel p-5 shadow-[5px_5px_0_#000] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Example: five animated videos</p>
              <table className="mt-3 w-full text-sm">
                <caption className="sr-only">Rewards for five example videos</caption>
                <tbody className="divide-y-2 divide-line border-t-2 border-line">
                  {EXAMPLE_VIDEOS.map((views, i) => (
                    <tr key={i}>
                      <th scope="row" className="py-2.5 text-left font-normal text-slate-200">
                        Video {i + 1} · {views.toLocaleString("en-US")} views
                      </th>
                      <td className="py-2.5 text-right font-bold text-mint">{usd(views)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-[3px] border-line">
                    <th scope="row" className="py-3 text-left font-bold text-white">Total · {exampleTotal.toLocaleString("en-US")} views</th>
                    <td className="py-3 text-right font-display text-2xl text-sun">{usd(exampleTotal)}</td>
                  </tr>
                </tfoot>
              </table>
              <p className="mt-1 text-xs text-slate-500">Rewards from all your eligible content add up in one earnings balance on your creator dashboard.</p>
            </div>

            <div className="border-2 border-line bg-panel p-5 sm:p-6">
              <h3 className="font-display text-2xl uppercase text-white">How you qualify</h3>
              <p className="mt-2 leading-7 text-slate-300">
                Consistent Mafiki creators with at least <strong className="text-white">100 subscribers</strong> and{" "}
                <strong className="text-white">10,000 views</strong> become eligible automatically. It&apos;s a one-time milestone: no
                need to re-apply.
              </p>
              <p className="mt-2 leading-7 text-slate-300">To keep earning, post consistently on a set day and time. Miss it, and you lose that month&apos;s reward.</p>
            </div>
            <div className="border-2 border-line bg-panel p-5 sm:p-6">
              <h3 className="font-display text-2xl uppercase text-white">What counts as an eligible view</h3>
              <p className="mt-2 leading-7 text-slate-300">
                Real readers only. Bots, artificial traffic and fraudulent engagement never count. Toon Central will publish how views are
                counted, when rewards are calculated and when payouts are made.
              </p>
            </div>
          </div>
        </section>

        {/* Creator of the Month */}
        <section>
          <div className="mx-auto max-w-2xl text-center">
            <SectionTitle>Creator of the Month</SectionTitle>
            <p className="mt-4 leading-7 text-slate-300">
              At Toon Central we reward consistency and commitment. Creators who upload steadily all month appear on the leaderboard and
              receive rewards, courtesy of Toon Central. It&apos;s open to everyone who keeps a steady schedule, not just the biggest
              audiences.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-2xl border-2 border-black bg-panel shadow-[5px_5px_0_#000]">
            <p className="flex items-center gap-2 border-b-2 border-line px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <IoTrophyOutline className="text-base text-sun" /> This month&apos;s leaderboard
              <span className="ml-auto hidden sm:inline">Uploads</span>
              <span className="w-14 text-right">Reward</span>
            </p>
            <ol className="divide-y-2 divide-line">
              {[1, 2, 3].map((place) => (
                <li key={place} className="flex items-center gap-4 px-5 py-4">
                  <span className={`w-6 font-display text-3xl leading-none ${place === 1 ? "text-sun" : "text-slate-300"}`}>{place}</span>
                  <span className="h-3 flex-1 bg-line" aria-hidden="true" />
                  <span className="hidden h-3 w-10 bg-line sm:block" aria-hidden="true" />
                  <span className="h-3 w-14 bg-mint/25" aria-hidden="true" />
                </li>
              ))}
            </ol>
            <p className="border-t-2 border-line px-5 py-3 text-xs text-slate-500">The first leaderboard is published at the end of the month.</p>
          </div>
        </section>
      </div>

      <section className="border-t-2 border-line">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center md:px-8">
          <h2 className="font-display text-4xl uppercase leading-[0.95] text-white sm:text-5xl">
            Create your stories. Grow your audience. <span className="text-mint">Earn from your work.</span>
          </h2>
          <Link href="/creator/dashboard" className="btn btn-primary mt-8 gap-2 px-6 py-3 text-base">
            Open Creator Studio <IoArrowForward />
          </Link>
          <p className="mt-5 text-sm text-slate-400">Toon Central, giving Africa a voice.</p>
        </div>
      </section>
    </Creator101Shell>
  );
}
