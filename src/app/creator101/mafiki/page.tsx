import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { IoArrowForward } from "react-icons/io5";
import { Creator101Shell, PUBLISH_HREF, SectionTitle } from "@/components/creator101/Creator101Shell";
import { EARTH, GuardianMask, MotifIcon, PatternedPanels, PatternStrip, type Motif } from "@/components/creator101/MafikiArt";
import { getOriginalsPageData, getSiteStats } from "@/lib/api/client";
import { cloudinary, comicHref, formatCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mafiki · Creator 101 | Toon Central",
  description: "Mafiki is Toon Central's comic style: a visual language drawn from the way Africa has always carved, stitched and shaped the human form.",
};

// Copy and drawings from the client's "Mafiki: The Art of African Comics" guide (docs/creator-guide/mafiki),
// without its "Who made it" section. Example art in /public/creator-guide/mafiki.

const STEPS = [
  { href: "#roots", title: "Know the roots", body: "Art as something sacred, never an import." },
  { href: "#look", title: "See the look", body: "Stylized forms, horns, pointed teeth, guardians." },
  { href: "#marafiki", title: "Meet the Marafiki", body: "The name, the style and the creators." },
];

const ROOTS: { motif: Motif; title: string; body: string }[] = [
  { motif: "sacred", title: "Sacred", body: "A way to honor ancestors and deities." },
  { motif: "bridge", title: "A bridge", body: "It can pierce the veil between life and death, calling on spirits of the past, present and future for guidance." },
  { motif: "language", title: "A language", body: "It encodes myths, genealogies and moral codes in visual form." },
  { motif: "alive", title: "Alive", body: "Through drumming, dancing and libation, works become vessels for ancestral spirits and unite communities." },
];

const DISTINCT = [
  { title: "Function and purpose", body: "Masks and statues are active tools in rituals, agricultural rites and ceremonies, used to heal communities or reach the ancestors. They are not silent objects on a wall." },
  { title: "Abstraction over realism", body: "Stylized forms and geometric motifs come before realism. Enlarged heads and elongated shapes symbolize spiritual power, vitality and inner strength." },
  { title: "Performance", body: "Traditional art is often performative, joining sculpture with music, dance and storytelling, such as the West African griots at community festivals." },
  { title: "Coded meaning", body: "Colors, patterns and shapes carry proverbs, social status and clan history, from Zulu beadwork messages to stories woven into Ghanaian Kente cloth." },
  { title: "Materials of the land", body: "Creators use what the environment gives: native hardwoods, terracotta, clay, raffia, shells and bronze, so each piece stays connected to its region." },
];

const LOOK: { motif: Motif; title: string; body: string }[] = [
  { motif: "horns", title: "Horns", body: "Marks of power and protection." },
  { motif: "teeth", title: "Pointed teeth", body: "A warning to anything evil." },
  { motif: "features", title: "Pushed features", body: "Exaggerated eyes, jaws and proportions." },
  { motif: "guardian", title: "Guardians", body: "Characters designed to protect." },
];

const IN_THE_ART = [
  { title: "Pushed proportions", body: "Elongated faces and pointed chins sit slightly beyond natural, like the carved faces our ancestors made." },
  { title: "Intense, guardian-like gaze", body: "Heavy brows and sharp, narrowed eyes give even calm faces a watchful, protective presence." },
  { title: "Hair as pattern", body: "Braids, locs, cornrows, curls and afros become bold, repeating shapes, the same thinking as the patterns that accompany Mafiki." },
  { title: "Free-form stylization", body: "Eyes can become abstract dark shapes and features can be simplified or exaggerated, with no rigid mold." },
];

// Example art, cut out from its background (sources in docs/creator-guide/mafiki). Pieces that carry an
// artist's handle are credited.
const GALLERY = [
  { src: "character-sheet.webp", w: 1200, h: 800, alt: "Character sheet of Mafiki heads with varied expressions and hairstyles: afros, braids, locs, buns, shaved and short cuts", caption: "Heads and expressions", wide: true },
  { src: "hairstyles.webp", w: 1200, h: 1200, alt: "Six women drawn with sculpted hairstyles: bantu knots, braids, a high bun, cornrows and afro puffs", caption: "Hair as pattern" },
  { src: "portrait-gaze.webp", w: 400, h: 400, alt: "Close-up of a young woman with cornrows, a gold headpiece and a heavy-browed, watchful gaze", caption: "A guardian-like gaze" },
  { src: "portrait-kente.webp", w: 800, h: 800, alt: "A woman in a beaded necklace and Kente-patterned wrap", caption: "Pattern on cloth", credit: "@harrydunkwu" },
  { src: "elders.webp", w: 900, h: 900, alt: "Four tall elders in wrapped, patterned cloth and beadwork, with long, stretched proportions", caption: "Pushed proportions", credit: "@uzomadunkwu" },
];

const PATTERNS: { motif: Motif; title: string; body: string }[] = [
  { motif: "zigzag", title: "Zigzag", body: "Rhythm and movement." },
  { motif: "diamonds", title: "Diamonds", body: "Repeating lattice for cloth and walls." },
  { motif: "dots", title: "Dots and bands", body: "Borders and panel trim." },
  { motif: "triangles", title: "Triangles", body: "Echoes of teeth, horns and blades." },
];

const PALETTE = [
  { color: EARTH.hardwood, name: "Hardwood", body: "Deep carved brown" },
  { color: EARTH.terracotta, name: "Terracotta", body: "Fired red-orange" },
  { color: EARTH.clay, name: "Clay", body: "Warm earth" },
  { color: EARTH.raffia, name: "Raffia", body: "Dry golden fiber" },
  { color: EARTH.bronze, name: "Bronze", body: "Metal glint" },
  { color: EARTH.shell, name: "Shell", body: "Pale highlight" },
];

const APPROACH = [
  { title: "Free form", body: "No fixed mold for how a figure must look." },
  { title: "Stylized", body: "Shapes are chosen for meaning, not realism." },
  { title: "Patterned", body: "Motifs support the art on every page." },
];

const wrap = "mx-auto max-w-7xl px-6 md:px-8 lg:px-10";

function Kicker({ children }: { children: ReactNode }) {
  return <p className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-sun">{children}</p>;
}

function Section({ id, kicker, title, lead, children, className = "" }: { id?: string; kicker: string; title: string; lead?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-24 py-14 lg:py-20 ${className}`}>
      <div className={wrap}>
        <Kicker>{kicker}</Kicker>
        <SectionTitle>{title}</SectionTitle>
        {lead && <div className="mt-4 max-w-3xl space-y-4 text-lg leading-8 text-slate-300">{lead}</div>}
        {children}
      </div>
    </section>
  );
}

function MotifCard({ motif, title, body }: { motif: Motif; title: string; body: string }) {
  return (
    <li className="border-2 border-line bg-panel p-5">
      <MotifIcon motif={motif} className="h-12 w-auto text-slate-200" />
      <h3 className="mt-4 font-display text-2xl uppercase leading-none text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </li>
  );
}

// Creator 101 → Mafiki: the Mafiki art style, then Toon Central Originals to learn from.
export default async function MafikiPage() {
  const [originals, stats] = await Promise.all([getOriginalsPageData("popular"), getSiteStats()]);
  const examples = originals.comics.slice(0, 6);

  return (
    <Creator101Shell tab="mafiki" stats={stats}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-line">
        <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-96" />
        <div className={`relative grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-20 ${wrap}`}>
          <div>
            <span className="tag -rotate-2 bg-sun text-sm">A new identity for African comics</span>
            <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] text-white sm:text-7xl lg:text-8xl">This is Mafiki.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Mafiki is our comic style: a visual language drawn from the way Africa has always carved, stitched and shaped the human form.
              Here is what it is, where it comes from and who makes it.
            </p>
            <ol className="mt-10 grid gap-3 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.href}>
                  <a href={step.href} className="group flex h-full flex-col border-2 border-black bg-panel p-4 shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5">
                    <span className="font-display text-sm uppercase tracking-wide text-mint">Step {i + 1}</span>
                    <span className="mt-1 font-display text-2xl uppercase leading-none text-white group-hover:text-mint">{step.title}</span>
                    <span className="mt-2 text-sm leading-6 text-slate-400">{step.body}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
          <figure className="mx-auto w-full max-w-[280px] rotate-2 lg:max-w-none">
            <GuardianMask className="w-full shadow-[8px_8px_0_#000]" />
            <figcaption className="mt-4 text-center text-sm text-slate-400">A Mafiki guardian: pushed proportions, horns, sharp teeth, bold pattern.</figcaption>
          </figure>
        </div>
      </section>

      <Section
        id="roots"
        kicker="The roots"
        title="Art was never forced on us"
        lead={
          <>
            <p>
              Art was not forced on us like Western culture. Our ancestors always held it as sacred and spiritual. It is the core of our
              existence, and how we pay homage to ancestors and make sacrifices to deities. Some call it magic. We call it{" "}
              <em className="font-semibold not-italic text-mint">mafiki</em>, our way of art.
            </p>
            <p>
              Across West, Central and Southern Africa, from the Dogon of Mali and the Makonde of Tanzania to the Igbo and Yoruba of
              Nigeria, drawn symbols and carved objects are more than &quot;art&quot; in the Western sense. They are living conduits between
              this world and the spirit realm.
            </p>
          </>
        }
      >
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROOTS.map((item) => (
            <MotifCard key={item.title} {...item} />
          ))}
        </ul>
      </Section>

      <Section
        kicker="Why African art is distinct"
        title="Made to be used, not just viewed"
        lead={<p>African art is unique because it is deeply functional, symbolic and woven into daily community life, rather than made merely for passive viewing. Mafiki inherits that thinking.</p>}
        className="border-y-2 border-line bg-panel/40"
      >
        <ol className="mt-10 grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
          {DISTINCT.map((item, i) => (
            <li key={item.title} className="flex gap-4">
              <span className="font-display text-4xl leading-none text-sun">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-bold text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-300">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="look"
        kicker="The look"
        title="Forms pushed past the natural"
        lead={
          <>
            <p>
              Africans were mostly wood carvers rather than painters. Even in embroidery that showed people, and in clothing styles, the
              human form has always been stylized and pushed until it looks a tad unnatural. It is on purpose.
            </p>
            <p>
              Masks show it best. Protectors and some gods are made scarier, with horns and pointed teeth, to underline that they are
              guardians who scare off evil. Mafiki carries that idea into comics.
            </p>
          </>
        }
      >
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOOK.map((item) => (
            <MotifCard key={item.title} {...item} />
          ))}
        </ul>
      </Section>

      <Section
        kicker="In the art"
        title="See Mafiki on the page"
        lead={
          <p>
            Here is the style in practice. Faces are drawn long and angular, with narrow jaws, sharp chins, heavy brows and sculpted
            cheekbones. Proportions are pushed, not copied from life, the same way a carver reshapes a mask.
          </p>
        }
        className="border-t-2 border-line"
      >
        <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {GALLERY.map((art) => (
            <li key={art.src} className={art.wide ? "col-span-2 lg:row-span-2" : ""}>
              <figure className="flex h-full flex-col border-2 border-line bg-panel">
                <img
                  src={`/creator-guide/mafiki/${art.src}`}
                  alt={art.alt}
                  width={art.w}
                  height={art.h}
                  loading="lazy"
                  // Cut-outs on the card colour; the wide sheet sits centred when it spans two rows.
                  className={`w-full p-2 ${art.wide ? "h-auto lg:min-h-0 lg:flex-1 lg:object-contain" : "aspect-square object-contain"}`}
                />
                <figcaption className="flex flex-col gap-0.5 border-t-2 border-line px-3 py-2 text-xs sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                  <span className="font-semibold text-white">{art.caption}</span>
                  {art.credit && <span className="text-slate-400">Art: {art.credit}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {IN_THE_ART.map((item) => (
            <li key={item.title} className="border-l-4 border-sun bg-panel px-5 py-4">
              <h3 className="font-bold text-white">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <PatternStrip className="block h-8 w-full border-y-2 border-black" />

      <Section
        kicker="Patterns"
        title="Patterns walk beside every page"
        lead={<p>Patterns accompany Mafiki. They frame characters, fill clothing and backgrounds, and carry meaning the way carved and embroidered motifs always have.</p>}
      >
        <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {PATTERNS.map((item) => (
            <MotifCard key={item.title} {...item} />
          ))}
        </ul>
        <div className="mt-12 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <h3 className="font-display text-3xl uppercase leading-none text-white">Every panel wears a pattern</h3>
            <p className="mt-3 leading-7 text-slate-300">
              In Mafiki, each comic panel has a pattern attached to it, just as our art has always carried patterns. The pattern frames the
              moment and can reflect the scene, the character or the clan.
            </p>
          </div>
          <figure>
            <PatternedPanels className="w-full border-2 border-black shadow-[6px_6px_0_#000]" />
            <figcaption className="mt-3 text-xs text-slate-400">Illustrative layout only: four panels, four patterns (zigzag, diamonds, dots, triangles).</figcaption>
          </figure>
        </div>
      </Section>

      <Section
        kicker="Color"
        title="An earth-toned palette"
        lead={
          <p>
            African creators have always worked with materials taken from the land. Mafiki carries that into color: wherever a page is in
            color, it adorns earth undertones, so the art feels as organic and rooted as a carving.
          </p>
        }
        className="border-t-2 border-line"
      >
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PALETTE.map((swatch) => (
            <li key={swatch.name} className="overflow-hidden border-2 border-black bg-panel shadow-[4px_4px_0_#000]">
              <span className="block h-20" style={{ background: swatch.color }} aria-hidden="true" />
              <div className="border-t-2 border-black px-3 py-2.5">
                <p className="font-display text-xl uppercase leading-none text-white">{swatch.name}</p>
                <p className="mt-1 text-xs text-slate-400">{swatch.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        kicker="The approach"
        title="Free form and stylized"
        lead={
          <p>
            African Mafiki is free form. It does not follow a rigid template of faces and bodies. Each Marafiki can stretch, carve and
            simplify in their own hand, as long as the spirit stays: bold, stylized, protective and rooted.
          </p>
        }
        className="border-t-2 border-line"
      >
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {APPROACH.map((item) => (
            <li key={item.title} className="border-2 border-black bg-mint p-5 text-ink shadow-[4px_4px_0_#000]">
              <h3 className="font-display text-3xl uppercase leading-none">{item.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-ink/80">{item.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="marafiki"
        kicker="Our comic style and creators"
        title="Mafiki and the Marafiki"
        lead={
          <>
            <p>
              Mafiki is a shortened, stylized form of &quot;Marafiki&quot;. Just as &quot;manga&quot; names Japanese comics, Mafiki names
              the essence of African storytelling, merging who we were as a people with who we have become through our trials and trauma.
              It sets Toon Central apart in the global comic industry.
            </p>
            <p>
              Our creators are the Marafiki. The word means &quot;friends&quot; in Swahili, reflecting a collaborative, supportive
              creative community. Like the Japanese &quot;mangaka&quot;, it names the artists who craft stories that reinforce our
              identity and culture.
            </p>
          </>
        }
        className="border-t-2 border-line"
      >
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            { from: "Manga", to: "Mafiki", body: "The comic style." },
            { from: "Mangaka", to: "Marafiki", body: "The creators, and friends to one another." },
          ].map((pair) => (
            <li key={pair.to} className="border-2 border-line bg-panel p-6">
              <p className="flex flex-wrap items-center gap-3 font-display text-3xl uppercase leading-none sm:text-4xl">
                <span className="text-slate-500">{pair.from}</span>
                <IoArrowForward className="text-2xl text-sun" aria-label="becomes" />
                <span className="text-white">{pair.to}</span>
              </p>
              <p className="mt-3 text-sm text-slate-300">{pair.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <section className={`border-t-2 border-line py-14 lg:py-20 ${wrap}`}>
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

      <section className={`pb-16 ${wrap}`}>
        <div className="grid gap-6 border-[3px] border-black bg-mint p-6 text-ink shadow-[8px_8px_0_#000] sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h2 className="font-display text-4xl uppercase leading-[0.95]">Ready to draw yours?</h2>
            <p className="mt-2 font-medium text-ink/80">The uploading guide covers panel placement, speech bubbles, fonts, sizes and pacing, with examples.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/creator101/uploading" className="btn gap-2 border-black bg-ink px-6 py-3 text-base text-white shadow-[4px_4px_0_#000]">
              Uploading guide <IoArrowForward />
            </Link>
            <Link href={PUBLISH_HREF} className="btn border-black bg-paper px-6 py-3 text-base text-ink shadow-[4px_4px_0_#000]">Publish</Link>
          </div>
        </div>
      </section>
    </Creator101Shell>
  );
}
