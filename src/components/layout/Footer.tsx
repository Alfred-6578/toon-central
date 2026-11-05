import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { Logo } from "@/components/ui/Logo";

// Routes and accounts as they exist on tooncentralhub.com.
const columns = [
  {
    title: "Read",
    links: [
      { label: "Discover", href: "/discover" },
      { label: "New & Popular", href: "/new" },
      { label: "Shorts", href: "/shorts" },
      { label: "Originals", href: "/originals" },
      { label: "Genres", href: "/genres" },
      { label: "Subscription", href: "/subscription" },
    ],
  },
  {
    title: "Create",
    desktopOnly: true, // publishing is desktop-only
    links: [
      { label: "Upload a Mafiki", href: "/creator/comics/new" },
      { label: "Upload a short", href: "/shorts/upload" },
      { label: "Creator dashboard", href: "/creator/dashboard" },
      { label: "Creator 101", href: "/creator101" },
    ],
  },
  {
    title: "Toon Central",
    links: [
      { label: "About us", href: "/about" },
      { label: "Feedback", href: "/feedback" },
      { label: "Contact", href: "/contactus" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/policies" },
    ],
  },
];

const socials = [
  { label: "X", href: "https://x.com/tooncentralhq", icon: FaXTwitter },
  { label: "Instagram", href: "https://www.instagram.com/tooncentralofficial/", icon: FaInstagram },
  { label: "Facebook", href: "https://www.facebook.com/share/18wVBfGfLe/", icon: FaFacebookF },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/toon-central-hub/", icon: FaLinkedinIn },
];

export type FooterStats = { originals: number; creators: number; shorts: number; genres: number };

export function Footer({ stats }: { stats: FooterStats }) {
  const credits = [
    { value: stats.originals, label: "Originals" },
    { value: stats.creators, label: "Indie creators" },
    { value: stats.shorts, label: "Shorts" },
    { value: stats.genres, label: "Genres" },
  ];

  return (
    <footer className="mt-10 border-t-2 border-line bg-panel px-4 py-8 sm:px-6 sm:py-10 md:px-8 lg:px-10">
      <div className="grid gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
        {/* Back-cover credits box, like the colophon on a comic's last page (the blurb is left out on phones) */}
        <div className="border-2 border-line bg-ink p-4 sm:p-6">
          <Logo className="h-10 w-auto text-mint sm:h-14" />
          <p className="mt-2 font-display text-xl uppercase sm:mt-3 sm:text-2xl leading-none text-white">Giving Africa a voice</p>
          <p className="mt-3 hidden max-w-sm text-sm leading-6 text-slate-400 sm:block">
            Mafiki and animated shorts from African creators, from Toon Central originals to the indies.
          </p>
          <dl className="mt-4 grid grid-cols-4 gap-2 border-t-2 border-line pt-3 sm:mt-6 sm:pt-4">
            {credits.map((item) => (
              <div key={item.label}>
                <dt className="sr-only">{item.label}</dt>
                <dd className="font-display text-2xl leading-none text-mint sm:text-3xl">{item.value}</dd>
                <dd className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-400 sm:text-[11px]">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-8 lg:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title} className={"desktopOnly" in column ? "hidden lg:block" : undefined}>
              <p className="font-display text-base uppercase tracking-wide text-white">{column.title}</p>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-300 sm:mt-4 sm:space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}><a href={link.href} className="hover:text-mint">{link.label}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 flex flex-wrap items-end justify-between gap-4 border-t-2 border-line pt-5 sm:gap-6 sm:pt-6 lg:col-span-3">
            <div>
              <p className="font-display text-base uppercase tracking-wide text-white">Follow</p>
              <div className="mt-3 flex gap-2">
                {socials.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Toon Central on ${label}`}
                    className="flex h-9 w-9 items-center justify-center border-2 border-line text-base text-slate-200 hover:border-mint hover:text-mint sm:h-10 sm:w-10 sm:text-lg"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">In partnership with</span>
              <img src="/brand/partners/itel.png" alt="itel" width={64} height={40} className="h-8 w-auto sm:h-10" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t-2 border-line pt-5 text-xs text-slate-400 sm:mt-10 sm:text-sm">
        <p>© 2026 Toon Central. All rights reserved.</p>
        <a href="#" className="font-semibold text-slate-300 hover:text-mint">Back to top ↑</a>
      </div>
    </footer>
  );
}
