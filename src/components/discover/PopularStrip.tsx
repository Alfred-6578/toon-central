import Link from "next/link";
import { FaRegEye } from "react-icons/fa6";
import { IoHeart } from "react-icons/io5";
import { VscNotebook } from "react-icons/vsc";
import type { Comic } from "@/lib/api/types";
import { cloudinary, comicHref, formatCount } from "@/lib/format";

// "Popular by Indies": the most-read Mafiki from independent creators, as a sideways strip of wide,
// rounded banner cards with the title and counts over the art (the live site's card style).
export function PopularStrip({ comics }: { comics: Comic[] }) {
  return (
    <section aria-labelledby="popular-title" className="mt-16">
      <h2 id="popular-title" className="text-lg font-semibold text-white">Popular by Indies</h2>
      <ul className="hide-scrollbar -mx-6 mt-4 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 md:-mx-8 md:scroll-px-8 md:px-8 lg:-mx-10 lg:scroll-px-10 lg:px-10">
        {comics.map((comic) => (
          <li key={comic.uuid} className="w-[92%] shrink-0 snap-start sm:w-[62%] lg:w-[40%]">
            <Link
              href={comicHref(comic.uuid)}
              className="group relative block aspect-[7/2] overflow-hidden rounded-lg border border-white/10 bg-panel"
            >
              <img
                src={cloudinary(comic.backgroundImage, 900)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex flex-col justify-end p-4">
                <p className="truncate text-lg font-bold uppercase leading-tight text-white drop-shadow">{comic.title}</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white/90">
                  <span className="flex items-center gap-1"><FaRegEye /> {formatCount(comic.views)}</span>
                  <span aria-hidden="true">•</span>
                  <span className="flex items-center gap-1"><IoHeart /> {formatCount(comic.likes)}</span>
                  {comic.episodes != null && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span className="flex items-center gap-1"><VscNotebook /> {comic.episodes}</span>
                    </>
                  )}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
