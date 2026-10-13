import type { Metadata } from "next";
import Link from "next/link";
import { AccountPage } from "@/components/account/AccountPage";
import { BubbleDots, ComicGridSkeleton, InkLogoLoader } from "@/components/ui/Loaders";

export const metadata: Metadata = { title: "Loading & welcome preview | Toon Central", robots: { index: false } };

// For client review: every loading state in one place, and a way to replay the one-time welcome.
export default function LoadingPreviewPage() {
  return (
    <AccountPage title="Loading & welcome" width="max-w-6xl">
      <div className="grid gap-12">
        <section>
          <h2 className="font-display text-3xl uppercase text-white">Welcome screen</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Shown once, on a reader&apos;s first visit to the homepage. Links straight to a comic or short skip it. Four styles to compare; on the homepage, Design options → Welcome screen switches between them.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/?intro=1" className="btn btn-primary px-5 py-3">A · Comic page</Link>
            <Link href="/?welcome=voices&intro=1" className="btn btn-primary px-5 py-3">B · Many voices</Link>
            <Link href="/?welcome=zoom&intro=1" className="btn btn-primary px-5 py-3">C · Pull back</Link>
            <Link href="/?welcome=wall&intro=1" className="btn btn-primary px-5 py-3">D · Cover wall</Link>
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl uppercase text-white">Page loader</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Shown while a page is prepared. It fades in only after a short delay, so fast page changes never flash it. After 8
            seconds a plain line about the connection appears.
          </p>
          <div className="mt-4 border-2 border-line bg-ink py-16">
            <InkLogoLoader />
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl uppercase text-white">Small loader</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">For search, buttons and anything that loads in place.</p>
          <div className="mt-4 flex items-center gap-8 border-2 border-line bg-ink px-6 py-8">
            <BubbleDots className="text-mint" />
            <BubbleDots className="text-slate-400" />
            <BubbleDots className="text-white" />
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl uppercase text-white">Card placeholders</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Every comic and short card shows this behind its cover until the image arrives.
          </p>
          <div className="mt-4">
            <ComicGridSkeleton count={5} />
          </div>
        </section>
      </div>
    </AccountPage>
  );
}
