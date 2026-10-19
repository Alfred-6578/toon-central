import type { Metadata } from "next";
import { IoCheckmark, IoClose, IoSwapVertical } from "react-icons/io5";
import { Creator101Shell } from "@/components/creator101/Creator101Shell";
import { GUIDE, GUIDE_INTRO, SIZE_TABLE, type GuideExample } from "@/data/uploadGuide";
import { getSiteStats } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Uploading · Creator 101 | Toon Central",
  description: "Before you upload: readability, clarity and pacing for vertical-scroll Mafiki, with do and don't examples.",
};

const partLabel = (n: number, i: number) => `${n}${String.fromCharCode(97 + i)}`;

// Creator 101 → Uploading: the "Before you upload" guide, section by section with do/don't examples.
export default async function UploadingGuidePage() {
  const stats = await getSiteStats();

  return (
    <Creator101Shell tab="uploading" stats={stats}>
      <section className="relative overflow-hidden border-b-2 border-line">
        <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-96" />
        <div className="relative mx-auto max-w-7xl px-6 py-14 md:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-mint">Toon Central presents</p>
          <h1 className="mt-3 font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl lg:text-8xl">{GUIDE_INTRO.title}</h1>
          <div className="mt-5 grid max-w-2xl gap-2 text-lg leading-8 text-slate-300">
            {GUIDE_INTRO.intro.map((p) => <p key={p}>{p}</p>)}
          </div>
          <p className="mt-8 font-semibold text-white">{GUIDE_INTRO.callout}</p>
          <ol className="mt-4 flex flex-wrap gap-3">
            {GUIDE.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-3 border-2 border-black bg-mint py-2 pl-2 pr-5 font-display text-2xl uppercase text-ink shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex h-8 w-8 items-center justify-center bg-ink text-lg text-mint">{s.n}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 md:px-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-10 lg:py-20">
        {/* Contents, kept in view on wide screens. */}
        <nav aria-label="Guide contents" className="hidden lg:block">
          <ol className="sticky top-36 grid gap-5 text-sm">
            {GUIDE.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="font-display text-xl uppercase text-white hover:text-mint">
                  {s.n}. {s.title}
                </a>
                <ol className="mt-2 grid gap-1.5 border-l-2 border-line pl-3">
                  {s.parts.map((part, i) => (
                    <li key={part.id}>
                      <a href={`#${part.id}`} className="text-slate-400 hover:text-mint">
                        <span className="text-slate-600">{partLabel(s.n, i)}</span> {part.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid gap-24">
          {GUIDE.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-36">
              <header className="flex items-end gap-4 border-b-[3px] border-mint pb-4">
                <span className="font-display text-8xl leading-[0.75] text-mint">{section.n}</span>
                <div>
                  <h2 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">{section.title}</h2>
                  <p className="mt-2 text-slate-300">{section.lead}</p>
                </div>
              </header>

              <div className="mt-12 grid gap-16">
                {section.parts.map((part, i) => (
                  <article key={part.id} id={part.id} className="scroll-mt-36">
                    <h3 className="font-display text-3xl uppercase text-white">
                      <span className="mr-2 text-mint">{partLabel(section.n, i)}</span>
                      {part.title}
                    </h3>
                    <div className="mt-6 grid gap-12">
                      {part.rules.map((rule) => (
                        <div key={rule.text}>
                          <p className="max-w-2xl leading-7 text-slate-200">{rule.text}</p>
                          <ul className={`mt-6 grid items-start gap-4 sm:gap-8 ${rule.examples.length > 1 ? "grid-cols-2" : "max-w-sm grid-cols-1"} max-w-3xl`}>
                            {rule.examples.map((example) => (
                              <li key={example.src}>
                                <Example example={example} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      {part.id === "size-chart" && <SizeTable />}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Creator101Shell>
  );
}

// One do/don't example on white "paper", stamped with a tick or a cross. Very tall strips scroll inside
// their frame, so the reader feels the pacing they demonstrate.
function Example({ example }: { example: GuideExample }) {
  const tall = example.height / example.width > 2.6;
  const image = (
    <img src={example.src} alt={example.caption ?? ""} width={example.width} height={example.height} loading="lazy" className="mx-auto h-auto w-full" />
  );

  return (
    // Never wider than the art itself (+ the paper border), so the crops aren't blown up.
    <figure className="mx-auto" style={{ maxWidth: example.width + 28 }}>
      <div className="relative border-2 border-black bg-white p-2 shadow-[5px_5px_0_#000] sm:p-3">
        {tall ? (
          <div className="hide-scrollbar max-h-[34rem] overflow-y-auto overscroll-contain" tabIndex={0} aria-label="Scrollable example">
            {image}
          </div>
        ) : (
          image
        )}
        {example.verdict && (
          <span
            className={`absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-black text-2xl shadow-[2px_2px_0_#000] ${
              example.verdict === "do" ? "bg-mint text-ink" : "bg-[#ff4d5e] text-white"
            }`}
          >
            {example.verdict === "do" ? <IoCheckmark aria-label="Do" /> : <IoClose aria-label="Don't" />}
          </span>
        )}
        {tall && (
          <span className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 border-2 border-black bg-sun px-2 py-1 text-[11px] font-bold uppercase text-ink">
            <IoSwapVertical /> Scroll
          </span>
        )}
      </div>
      {example.caption && <figcaption className="mt-3 text-sm leading-5 text-slate-400">{example.caption}</figcaption>}
    </figure>
  );
}

// Pixels to points at 72 and 300 dpi, with a live sample at each size.
function SizeTable() {
  return (
    <div className="max-w-3xl overflow-x-auto">
      <table className="w-full min-w-[32rem] border-2 border-line text-center text-sm">
        <caption className="pb-3 text-left font-bold uppercase tracking-[0.12em] text-slate-400">Pixels to points</caption>
        <thead>
          <tr className="bg-panel">
            <th scope="col" className="border-2 border-line px-3 py-2 text-left text-slate-400">Pixels</th>
            {SIZE_TABLE.px.map((px) => (
              <th key={px} scope="col" className="border-2 border-line px-3 py-2 text-white">{px} px</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-300">
          <tr>
            <th scope="row" className="border-2 border-line px-3 py-2 text-left font-normal text-slate-400">Looks like</th>
            {SIZE_TABLE.px.map((px) => (
              <td key={px} className="border-2 border-line bg-white px-2 py-2 font-bold uppercase leading-none text-ink" style={{ fontSize: px }}>
                Aa
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="border-2 border-line px-3 py-2 text-left font-normal text-slate-400">At 72 dpi</th>
            {SIZE_TABLE.pt72.map((pt) => <td key={pt} className="border-2 border-line px-3 py-2">{pt}</td>)}
          </tr>
          <tr>
            <th scope="row" className="border-2 border-line px-3 py-2 text-left font-normal text-slate-400">At 300 dpi</th>
            {SIZE_TABLE.pt300.map((pt) => <td key={pt} className="border-2 border-line px-3 py-2">{pt}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
