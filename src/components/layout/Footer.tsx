import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { Logo } from "@/components/ui/Logo";

// Routes and accounts as they exist on tooncentralhub.com.
const columns = [
  {
    title: "Read",
    links: [
      { label: "Trending", href: "/#trending" },
      { label: "Shorts", href: "/#shorts" },
      { label: "Originals", href: "/#originals" },
      { label: "Genres", href: "/#genres" },
      { label: "Subscription", href: "/subscription" },
    ],
  },
  {
    title: "Create",
    links: [
      { label: "Upload a comic", href: "/creator/new" },
      { label: "Upload a short", href: "/shorts/upload" },
      { label: "Creator dashboard", href: "/creator/dashboard" },
      { label: "Creator101", href: "/creator101" },
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
    <footer className="mt-10 border-t-2 border-line bg-panel px-6 py-10 md:px-8 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
        {/* Back-cover credits box, like the colophon on a comic's last page */}
        <div className="border-2 border-line bg-ink p-6">
          <Logo className="h-14 w-auto text-mint" />
          <p className="mt-3 font-display text-2xl uppercase leading-none text-white">Giving Africa a voice</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
            Comics, webtoons and animated shorts from African creators, from Toon Central originals to the indies.
          </p>
          <dl className="mt-6 grid grid-cols-4 border-t-2 border-line pt-4">
            {credits.map((item) => (
              <div key={item.label}>
                <dt className="sr-only">{item.label}</dt>
                <dd className="font-display text-3xl leading-none text-mint">{item.value}</dd>
                <dd className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="font-display text-base uppercase tracking-wide text-white">{column.title}</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {column.links.map((link) => (
                  <li key={link.label}><a href={link.href} className="hover:text-mint">{link.label}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 flex flex-wrap items-end justify-between gap-6 border-t-2 border-line pt-6 sm:col-span-3">
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
                    className="flex h-10 w-10 items-center justify-center border-2 border-line text-lg text-slate-200 hover:border-mint hover:text-mint"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">In partnership with</span>
              <img src="/brand/partners/itel.png" alt="itel" width={64} height={40} className="h-10 w-auto" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t-2 border-line pt-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Toon Central. All rights reserved.</p>
        <a href="#" className="font-semibold text-slate-300 hover:text-mint">Back to top ↑</a>
      </div>
    </footer>
  );
}
