"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { IoHomeOutline, IoLibraryOutline, IoReaderOutline, IoBookmarkOutline, IoPersonOutline } from "react-icons/io5";
import { IoHeartCircleOutline, IoHeartOutline } from "react-icons/io5";
import { VscNotebook } from "react-icons/vsc";
import { FaRegEye } from "react-icons/fa6";
import { MdPlayArrow } from "react-icons/md";

const navItems = ["Home", "Shorts", "Library", "Genres", "Top Rated"];

type Tone = "mint" | "cyan" | "violet";

const featuredSeries = [
  {
    label: "New drop",
    title: "Read stories that hit harder.",
    description:
      "A swordsman with a brutal reputation, unimaginable power, and a past that refuses to stay buried.",
    button: "Read now",
    secondaryButton: "View details",
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1600&q=80",
  },
  {
    label: "Editor’s pick",
    title: "The rise of the last guardian.",
    description:
      "A lone protector awakens to a city under siege and a prophecy that marks every step he takes.",
    button: "Start reading",
    secondaryButton: "See preview",
    image:
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1600&q=80",
  },
  {
    label: "Top rated",
    title: "Power, vengeance, and rebirth.",
    description:
      "One final chance to rewrite destiny. The path forward is haunted by every decision that came before.",
    button: "Dive in",
    secondaryButton: "View chapter list",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    label: "Featured series",
    title: "The city remembers every scar.",
    description:
      "Mystery, betrayal, and impossible powers collide in a world where memory is the greatest weapon.",
    button: "Read chapter 1",
    secondaryButton: "More info",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80",
  },
];

const tagStyles: Record<Tone, string> = {
  mint: "border border-[#3effa2]/25 bg-[#3effa2]/10 text-[#aef7d2]",
  cyan: "border border-[#6ad9ff]/25 bg-[#6ad9ff]/10 text-[#bfeeff]",
  violet: "border border-[#8aa3ff]/25 bg-[#8aa3ff]/10 text-[#d3dcff]",
};

const trending = [
  {
    title: "Reggress King's Power",
    genre: "Fantasy",
    tone: "mint" as Tone,
    chapters: 156,
    creator: "K. Studios",
    views: "2.1M",
    likes: "145k",
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "The Devil Butler",
    genre: "Action",
    tone: "cyan" as Tone,
    chapters: 89,
    creator: "Dark Tales Inc",
    views: "1.8M",
    likes: "98k",
    image:
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "I am the Fated Villain",
    genre: "Drama",
    tone: "violet" as Tone,
    chapters: 104,
    creator: "Fate Works",
    views: "1.6M",
    likes: "76k",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Your talent is mine",
    genre: "Sci-Fi",
    tone: "cyan" as Tone,
    chapters: 67,
    creator: "Future Labs",
    views: "980k",
    likes: "52k",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Moonlit Reign",
    genre: "Romance",
    tone: "violet" as Tone,
    chapters: 45,
    creator: "Lunar Press",
    views: "750k",
    likes: "41k",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Steel Pulse",
    genre: "Sci-Fi",
    tone: "mint" as Tone,
    chapters: 92,
    creator: "Tech Comics",
    views: "1.2M",
    likes: "64k",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
  },
];

const updates = [
  {
    title: "Reggressing with the King's Power",
    chapter: "Chapter 65",
    genre: "Fantasy",
    tone: "mint" as Tone,
    secondaryGenre: "Action",
    secondaryTone: "cyan" as Tone,
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "The Devil Butler",
    chapter: "Chapter 54",
    genre: "Action",
    tone: "cyan" as Tone,
    secondaryGenre: "Drama",
    secondaryTone: "violet" as Tone,
    image:
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "I am the Fated Villain",
    chapter: "Chapter 41",
    genre: "Drama",
    tone: "violet" as Tone,
    secondaryGenre: "Fantasy",
    secondaryTone: "mint" as Tone,
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Your talent is mine",
    chapter: "Chapter 39",
    genre: "Sci-Fi",
    tone: "cyan" as Tone,
    secondaryGenre: "Romance",
    secondaryTone: "violet" as Tone,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Moonlit Whispers",
    chapter: "Chapter 28",
    genre: "Romance",
    tone: "violet" as Tone,
    secondaryGenre: "Fantasy",
    secondaryTone: "mint" as Tone,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Steel Covenant",
    chapter: "Chapter 52",
    genre: "Action",
    tone: "mint" as Tone,
    secondaryGenre: "Sci-Fi",
    secondaryTone: "cyan" as Tone,
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Echoes of Tomorrow",
    chapter: "Chapter 19",
    genre: "Sci-Fi",
    tone: "cyan" as Tone,
    secondaryGenre: "Drama",
    secondaryTone: "violet" as Tone,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Crimson Oath",
    chapter: "Chapter 71",
    genre: "Action",
    tone: "violet" as Tone,
    secondaryGenre: "Fantasy",
    secondaryTone: "mint" as Tone,
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  },
];

const newChapters = [
  {
    title: "Reggressing with the King's Power",
    chapter: "Chapter 66",
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "The Devil Butler",
    chapter: "Chapter 55",
    image:
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "I am the Fated Villain",
    chapter: "Chapter 42",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Your talent is mine",
    chapter: "Chapter 40",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  },
];

const recommended = [
  {
    title: "Fantasy",
    tone: "mint" as Tone,
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Romance",
    tone: "violet" as Tone,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Sci-fi",
    tone: "cyan" as Tone,
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Thriller",
    tone: "mint" as Tone,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Action",
    tone: "cyan" as Tone,
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Drama",
    tone: "violet" as Tone,
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Mystery",
    tone: "mint" as Tone,
    image:
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Adventure",
    tone: "cyan" as Tone,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  },
];

const originals = [
  {
    title: "Night Market Samurai",
    creator: "L. Harrow",
    chapters: 28,
    blurb: "A street blade who bargains with demons to protect the ones he loves.",
    genre: "Action",
    tone: "mint" as Tone,
    views: "312k",
    likes: "12.3k",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Signal of Fate",
    creator: "A. Romero",
    chapters: 14,
    blurb: "When the city answers, heroes are chosen by lost radio waves.",
    genre: "Sci-Fi",
    tone: "cyan" as Tone,
    views: "98k",
    likes: "4.1k",
    image:
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Iron Garden",
    creator: "M. Tanaka",
    chapters: 9,
    blurb: "Biomechanical flora and the children who tend to them in a ruined world.",
    genre: "Fantasy",
    tone: "violet" as Tone,
    views: "54k",
    likes: "2.2k",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  },
];

const RevealOnScroll = ({ children, className = "", delay = 0 }: { children: ReactNode; className?: string, delay?: number }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [rotationKey, setRotationKey] = useState(0);
  const currentSlide = featuredSeries[activeSlide];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % featuredSeries.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [rotationKey]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#070b14] text-white">
      <main className=" pb-24 md:pb-0">
        <header className="fixed z-40 w-full mb-5 flex items-center justify-between gap-4  px-6 md:px-8 lg:px-10 py-5 border-b border-white/2 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-12 items-center justify-center rounded-full text-sm font-black text-[#05131a]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="52"
                height="30"
                viewBox="0 0 52 30"
                fill="none"
                aria-label="Toon Central logo"
              >
                <path d="M0 0h52v30H0z" fill="#3effa2" opacity="0.18"/>
                <path d="M6 18.5c2.5-7 7.1-10.5 13.8-10.5 6.7 0 11.6 4 13.8 10.5-2.4 6.1-7.2 9.5-13.8 9.5-6.7 0-11.4-3.4-13.8-9.5Z" fill="#061a29" />
                <path d="M12.4 18.5c1.5-3.7 4.4-5.5 8.3-5.5 3.9 0 6.9 1.8 8.4 5.5-1.6 3.4-4.5 5.2-8.4 5.2-3.9 0-6.8-1.8-8.3-5.2Z" fill="#3effa2"/>
                <path d="M25.4 8.6h5.3v12.8h-5.3z" fill="#061a29"/>
              </svg>
            </div>
            <div>
              {/* <div className="text-xl font-black tracking-tight text-white">tooncentral</div> */}
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                className={item === "Home" ? "text-white" : "transition hover:text-white"}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="hidden rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-slate-200 md:inline-flex">
              Sign in
            </button>
            <button className="rounded-full bg-[#3effa2] px-4 py-2 text-sm font-bold text-[#061a29] shadow-[0_0_24px_rgba(62,255,162,0.35)] transition hover:brightness-110">
              Join now
            </button>
          </div>
        </header>

        <div className="mx-auto px-6 md:px-8 lg:px-10">
          <div className="h-20 w-full"></div>
        <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[#0c1320] p-4 sm:p-6 md:p-8 md:h-[70vh]">
          <div className="absolute inset-0 overflow-hidden">
            <img
              key={`${currentSlide.image}-${rotationKey}`}
              src={currentSlide.image}
              alt="Featured manga cover"
              className="hero-image h-full w-full scale-125 object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/85 via-[#070b14]/35 to-[#070b14]/20" />
          </div>

          <div className="relative flex min-h-[470px] flex-col justify-end p-2 sm:p-4 md:p-6">
            <div key={`${currentSlide.title}-${rotationKey}`} className="max-w-xl">
              <div className="hero-reveal mb-5 inline-flex items-center gap-2 rounded-full border border-[#3effa2]/20 bg-[#3effa2]/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#bfffe0]" style={{ animationDelay: "0ms" }}>
                <span className="inline-block h-2 w-2 rounded-full bg-[#3effa2]" />
                {currentSlide.label}
              </div>

              <h1 className="hero-reveal max-w-xl text-4xl font-black leading-none tracking-[-0.06em] text-white md:text-6xl" style={{ animationDelay: "140ms" }}>
                {currentSlide.title}
              </h1>

              <p className="hero-reveal mt-5 max-w-lg text-base leading-7 text-slate-300" style={{ animationDelay: "280ms" }}>
                {currentSlide.description}
              </p>

              <div className="hero-reveal mt-7 flex flex-wrap gap-3" style={{ animationDelay: "420ms" }}>
                <button className="rounded-full bg-[#3effa2] px-5 py-3 text-sm font-bold text-[#061a29] transition hover:brightness-110">
                  {currentSlide.button}
                </button>
                <button className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  {currentSlide.secondaryButton}
                </button>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#bfffe0]">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#3effa2]" />
                Featured series
              </div>

              <div className="flex items-end gap-2 md:flex">
                {featuredSeries.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => {
                      setActiveSlide(index);
                      setRotationKey((prev) => prev + 1);
                    }}
                    aria-label={`Show slide ${index + 1}`}
                    className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                      index === activeSlide ? "bg-[#3effa2] w-7" : "bg-white/35 hover:bg-white/55"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>


        <section className="mt-12 overflow-hidden">
          <RevealOnScroll className="block" delay={0}>
            <div className="mb-5 flex sm:items-center justify-between">
              <div className="flex max-sm:flex-col sm:items-center gap-2 text-sm font-semibold text-white">
                <RevealOnScroll delay={120} className="block">
                  <span className="text-xl sm:text-2xl">Trending</span>
                </RevealOnScroll>

                <RevealOnScroll delay={180} className="block">
                  <div className="flex items-center gap-2 rounded-full border border-white/8 bg-[#0d1726] p-1">
                    {[
                      { label: "Today", active: true },
                      { label: "Weekly", active: false },
                      { label: "Monthly", active: false },
                    ].map((filter) => (
                      <button
                        key={filter.label}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] transition ${
                          filter.active
                            ? "bg-[#3effa2] text-[#061a29]"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </RevealOnScroll>
              </div>

              <RevealOnScroll delay={220} className="block">
                <button className="text-sm font-medium text-slate-300 transition hover:text-white">View all →</button>
              </RevealOnScroll>
            </div>

            {/* Mobile Slider - Below SM */}
            <div className="sm:hidden overflow-x-auto scroll-smooth pb-2 -mx-6 px-6 hide-scrollbar">
              <div className="flex gap-4 w-max">
                {trending.map((item, index) => (
                  <RevealOnScroll
                    key={item.title}
                    delay={280 + index * 75}
                    className="block"
                  >
                    <article className="group relative overflow-hidden rounded-[18px] border border-white/8 bg-[#121b2d] flex-shrink-0 w-[40vw] vsm:w-62">
                      <div className="absolute inset-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/80 via-[#070b14]/40 to-transparent" />
                      </div>

                      <div className="relative flex min-h-[260px] flex-col justify-end p-2 vms:p-3">
                        <span className={`mb-2 inline-flex w-fit items-center gap-2 rounded-full px-1.5 tny:px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tagStyles[item.tone]}`}>
                          {item.genre}
                        </span>

                        <h3 className="mb-1 sm:text-lg font-bold text-white line-clamp-1">{item.title}</h3>

                        <div className="mb-2 flex items-center gap-2 xsm:gap-1 tny:gap-2 text-[10px] xsm:text-xs text-slate-300">
                          <span className="flex items-center gap-0.5 tny:gap-1"><VscNotebook className="text-[10px] xsm:text-xs vsm:text-sm"/> {item.chapters} ch</span>
                          <span className="flex items-center gap-0.5 tny:gap-1"><FaRegEye className="text-[10px] xsm:text-xs vsm:text-sm"/> {item.views}</span>
                          <span className="flex items-center gap-0.5 tny:gap-1"><IoHeartOutline className="text-[10px] xsm:text-xs vsm:text-sm"/> {item.likes}</span>
                        </div>
                      </div>
                    </article>
                  </RevealOnScroll>
                ))}
              </div>
            </div>

            {/* Grid - SM and above */}
            <div className="hidden sm:grid gap-4 grid-cols-2 md:grid-cols-3">
              {trending.map((item, index) => (
                <RevealOnScroll
                  key={item.title}
                  delay={280 + index * 75}
                  className="block"
                >
                  <article className="group relative overflow-hidden rounded-[18px] border border-white/8 bg-[#121b2d]">
                    <div className="absolute inset-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/80 via-[#070b14]/40 to-transparent" />
                    </div>

                    <div className="relative flex min-h-[260px] flex-col justify-end p-3 sm:p-4">
                      <span className={`mb-2 inline-flex w-fit items-center gap-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tagStyles[item.tone]}`}>
                        {item.genre}
                      </span>

                      <h3 className="mb-1 text-lg font-bold text-white">{item.title}</h3>

                      <div className="mb-3 md:flex flex-wrap items-center gap-2 justify-between text-xs text-slate-300">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="flex items-center gap-1 sm:gap-2"><VscNotebook size={16}/> {item.chapters} ch</span>
                          <span className="flex items-center gap-1 sm:gap-2"><FaRegEye size={16}/> {item.views}</span>
                          <span className="flex items-center gap-1 sm:gap-2"><IoHeartOutline size={16}/> {item.likes}</span>
                        </div>
                        <div className="text-sm text-slate-200 max-sm:hidden">by {item.creator}</div>
                      </div>
                    </div>
                  </article>
                </RevealOnScroll>
              ))}
            </div>
          </RevealOnScroll>
        </section>

        <section className="mt-12 overflow-hidden rounded-[22px]">
          <RevealOnScroll delay={120} className="block">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Shorts</h2>
              <button className="text-sm font-medium text-slate-300 transition hover:text-white">View all →</button>
            </div>
          </RevealOnScroll>

          <div className="overflow-x-auto scroll-smooth pb-2 -mx-6 px-6 hide-scrollbar">
            <div className="flex gap-5 w-max">
              {updates.map((item, index) => (
                <RevealOnScroll key={item.title} delay={180 + index * 70} className="block">
                  <article className="relative group overflow-hidden flex-shrink-0 w-[44vw] vsm:w-62 sm:w-66">
                    <div className="relative h-68 overflow-hidden rounded-[18px]">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="py-3 px-1">
                      <h3 className="text-sm font-semibold text-white line-clamp-2">{item.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={`inline-flex rounded-full px-2 py-1 text-[8px] uppercase tracking-[0.12em] ${tagStyles[item.tone]}`}>
                          {item.genre}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-1 text-[8px] uppercase tracking-[0.12em] ${tagStyles[item.secondaryTone]}`}>
                          {item.secondaryGenre}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <p className="text-[11px] text-slate-300 flex gap-1 items-center"><FaRegEye size={14}/> 120k</p>
                        <p className="text-[11px] text-slate-300 flex gap-1 items-center"><IoHeartOutline size={14}/> 2.5k</p>
                      </div>
                    </div>
                  </article>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-lg">
          <RevealOnScroll delay={120} className="block">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-white">New Chapters</h2>
              <button className="text-sm font-medium text-slate-300 transition hover:text-white">View All →</button>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 md:grid-cols-2 ">
            {newChapters.map((item, index) => (
              <RevealOnScroll key={item.title} delay={180 + index * 80} className="block">
                <article className="group flex items-center gap-3 overflow-hidden">
                  <div className="relative h-28 w-40 flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center p-2">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.12em] text-[#3effa2]">NEW</p>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-200">{item.chapter}</p>
                    <p className="mt-1 text-[11px] text-slate-400">Released 4days ago</p>
                  </div>
                  <div className="flex items-center pr-3">
                    <button className="h-6 w-6 rounded-full bg-[#3effa2] text-sm font-black text-[#061a29] flex items-center justify-center">
                      ›
                    </button>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[22px]">
          <RevealOnScroll delay={120} className="block">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-white">Browser by genres</h2>
              <button className="text-sm font-medium text-slate-300 transition hover:text-white">View all →</button>
            </div>
          </RevealOnScroll>

          <div className="overflow-x-auto scroll-smooth pb-2 -mx-6 px-6 hide-scrollbar">
            <div className="flex gap-4 w-max">
              {recommended.map((item, index) => (
                <RevealOnScroll key={item.title} delay={180 + index * 75} className="block">
                  <article className="relative group overflow-hidden rounded-[18px] flex-shrink-0 w-[40vw] md:w-85">
                    <div className="relative h-60 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  
                   <span className={`absolute left-3 top-3 rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.12em] font-semibold ${tagStyles[item.tone]} backdrop-blur-sm`}>
                      {item.title}
                    </span>
                    <div className="absolute bottom-0 p-2 sm:p-3 w-full">
                      <div className="bg-[#111827] w-full p-3 rounded-lg flex flex-col items-center justify-between gap-2">
                        <div className="flex justify-between w-full">
                          <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                          <button className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3effa2] text-lg font-black text-[#061a29]">
                            ›
                          </button>
                        </div>
                        <div className="flex justify-between w-full">
                          <p className="mt-2 text-xs vsm:text-[13px] text-slate-300 flex gap-1 vsm:gap-1.5 items-center"><VscNotebook className="text-sm sm:text-lg"/> 38 </p>
                          <p className="mt-2 text-xs vsm:text-[13px] text-slate-300 flex gap-1 vsm:gap-1.5 items-center"><FaRegEye className="text-sm sm:text-lg"/> 120k</p>
                          <p className="mt-2 text-xs vsm:text-[13px] text-slate-300 flex gap-1 vsm:gap-1.5 items-center"><IoHeartOutline className="text-sm sm:text-lg"/> 2.5k</p>
                        </div>

                      </div>
                    </div>
                  </article>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[22px]">
          <RevealOnScroll delay={120} className="block">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-white">Toon Central Originals</h2>
              <button className="text-sm font-medium text-slate-300 transition hover:text-white">Explore originals →</button>
            </div>
          </RevealOnScroll>

          <div className="hidden sm:block">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {originals.map((card, index) => (
                <RevealOnScroll key={card.title} delay={180 + index * 90} className="block">
                  <article className="group h-86 relative overflow-hidden rounded-[18px] border border-white/8 bg-[#111827]">
                    <div className="absolute inset-0">
                      <img src={card.image} alt={card.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/80 via-[#070b14]/40 to-transparent" />
                    </div>

                    <div className="relative flex min-h-[340px] flex-col justify-end p-4">
                      <span className={`mb-2 gap-2 rounded-full w-fit px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tagStyles[card.tone]}`}>
                        {card.genre}
                      </span>

                      <h3 className="mb-1 text-lg font-bold text-white">{card.title}</h3>

                      <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-2"><VscNotebook size={16}/> {card.chapters} ch</span>
                          <span className="flex items-center gap-2"><FaRegEye size={16}/> {card.views}</span>
                          <span className="flex items-center gap-2"><IoHeartOutline size={16}/> {card.likes}</span>
                        </div>
                        <div className="text-sm text-slate-200 flex gap-1.5">by <p className="underline">{card.creator}</p></div>
                      </div>
                    </div>
                  </article>
                </RevealOnScroll>
              ))}
            </div>
          </div>

          <div className="sm:hidden overflow-x-auto scroll-smooth pb-2 -mx-6 px-6 hide-scrollbar">
            <div className="flex gap-4 w-max">
              {originals.map((card, index) => (
                <RevealOnScroll key={card.title} delay={180 + index * 90} className="block">
                  <article className="group relative h-[330px] w-[40vw] overflow-hidden rounded-[18px] border border-white/8 bg-[#111827]">
                    <div className="absolute inset-0">
                      <img src={card.image} alt={card.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/90 via-[#070b14]/40 to-transparent" />
                    </div>

                    <div className="relative flex h-full flex-col justify-end p-4">
                      <span className={`mb-2 w-fit rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tagStyles[card.tone]}`}>
                        {card.genre}
                      </span>

                      <h3 className="text-base font-bold text-white">{card.title}</h3>

                      <div className="mt-2 flex flex-col justify-between text-[12px] text-slate-300">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><VscNotebook size={12}/> {card.chapters} ch</span>
                          <span className="flex items-center gap-1"><FaRegEye size={12}/> {card.views}</span>
                          <span className="flex items-center gap-1"><IoHeartOutline size={12}/> {card.likes}</span>
                        </div>
                        {/* <span className="text-slate-200 underline">by {card.creator}</span> */}
                      </div>
                    </div>
                  </article>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* <section className="mt-12 rounded-[22px] ">
          <RevealOnScroll delay={120} className="block">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-white">Popular by indies</h2>
              <button className="text-sm font-medium text-slate-300 transition hover:text-white">Browse creators →</button>
            </div>
          </RevealOnScroll>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                title: "Luma Ink",
                series: "Glass Horizon",
                tone: "mint" as Tone,
                image:
                  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
                readers: "48k",
                badge: "Fresh drop",
              },
              {
                title: "Fable Forge",
                series: "Ash & Echo",
                tone: "cyan" as Tone,
                image:
                  "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
                readers: "31k",
                badge: "Editor pick",
              },
              {
                title: "Paper Void",
                series: "Nocturne Thread",
                tone: "violet" as Tone,
                image:
                  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
                readers: "26k",
                badge: "Trending",
              },
              {
                title: "North Arc",
                series: "Cold Signal",
                tone: "mint" as Tone,
                image:
                  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
                readers: "19k",
                badge: "New arrival",
              },
            ].map((creator, index) => (
              <RevealOnScroll key={creator.title} delay={180 + index * 80} className="block">
                <article className="group relative overflow-hidden rounded-[20px] border border-white/8 bg-[#0d1726]">
                  <div className="absolute inset-0">
                    <img src={creator.image} alt={creator.series} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/90 via-[#070b14]/30 to-transparent" />
                  </div>

                  <div className="relative flex min-h-[240px] flex-col justify-between p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${tagStyles[creator.tone]}`}>
                        {creator.badge}
                      </span>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#070b14]/40 text-sm font-black text-white backdrop-blur-sm">
                        ›
                      </button>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-300">{creator.title}</p>
                      <h3 className="mt-1 text-lg font-bold text-white">{creator.series}</h3>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-200">
                        <span className="flex items-center gap-1"><FaRegEye size={12}/> {creator.readers}</span>
                        <span className="text-[#3effa2]">+12% this week</span>
                      </div>
                    </div>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </section> */}

        <section className="mt-18 mb-12 relative overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top_left,_rgba(62,255,162,0.20),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(138,163,255,0.20),transparent_25%),linear-gradient(135deg,#09101a_0%,#101827_100%)] p-5 sm:p-6 md:p-8">
          <div className="absolute -left-16 top-10 h-44 w-44 rounded-full bg-[#3effa2]/15 blur-3xl" />
          <div className="absolute -right-12 bottom-0 h-52 w-52 rounded-full bg-[#8aa3ff]/12 blur-3xl" />

          <RevealOnScroll delay={120} className="relative block">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#3effa2]">Premium access</p>
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
                  Unlock the full library
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                  Read early chapters, support indie creators, and get access to curated drops before everyone else.
                </p>
              </div>

              <div className="w-full max-lg:hidden max-w-xl rounded-[24px] border border-white/10 bg-[#0b1320]/80 p-3 shadow-[0_0_40px_rgba(62,255,162,0.08)] backdrop-blur-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="h-12 flex-1 rounded-full border border-white/10 bg-[#111827] px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#3effa2]/60"
                  />
                  <button className="h-12 rounded-full bg-[#3effa2] px-6 text-sm font-bold text-[#061a29] shadow-[0_0_24px_rgba(62,255,162,0.35)] transition hover:brightness-110">
                    Subscribe now
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                  {['No spam', 'Early chapters', 'Full library'].map((item) => (
                    <span key={item} className="rounded-full border border-white/8 bg-white/3 px-2.5 py-1.5">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
               <button className="lg:hidden h-12 rounded-full bg-[#3effa2] px-6 text-sm font-bold text-[#061a29] shadow-[0_0_24px_rgba(62,255,162,0.35)] transition hover:brightness-110">
                    Subscribe now
                  </button>
            </div>
          </RevealOnScroll>
        </section>
        </div>
        <footer className="mt-10 rounded-[28px] bg-[#090f1a] px-6 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1.2fr]">
            <RevealOnScroll delay={120} className="block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3effa2] text-sm font-black text-[#07141d]">
                  T
                </div>
                <div>
                  <div className="text-xl font-black tracking-tight text-white">Tooncentral</div>
                  <p className="text-xs text-slate-400">Read stories that hit harder.</p>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
                Discover cult favorites, fresh indie hits, and premium chapters built for readers who love bold stories.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={150} className="block">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Explore</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  <li><a href="#" className="transition hover:text-white">Trending</a></li>
                  <li><a href="#" className="transition hover:text-white">New chapters</a></li>
                  <li><a href="#" className="transition hover:text-white">Originals</a></li>
                  <li><a href="#" className="transition hover:text-white">Genres</a></li>
                </ul>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={180} className="block">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Company</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  <li><a href="#" className="transition hover:text-white">About</a></li>
                  <li><a href="#" className="transition hover:text-white">Creators</a></li>
                  <li><a href="#" className="transition hover:text-white">Careers</a></li>
                  <li><a href="#" className="transition hover:text-white">Support</a></li>
                </ul>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={210} className="block">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Follow</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['X', 'Instagram', 'YouTube', 'Discord'].map((item) => (
                    <a
                      key={item}
                      href="#"
                      className="rounded-full border border-white/8 bg-white/3 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-[#3effa2]/40 hover:text-white"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-white/8 pt-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Toon Central. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-5">
              <a href="#" className="transition hover:text-white">Terms</a>
              <a href="#" className="transition hover:text-white">Privacy</a>
              <a href="#" className="transition hover:text-white">Contact</a>
            </div>
          </div>
        </footer>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-[#070b14]/95 px-3 py-2 backdrop-blur-md md:hidden">
        <div className="mx-auto flex items-center justify-between gap-2">
          {[
            { label: "Home", icon: IoHomeOutline, active: true },
            { label: "Watch", icon: IoBookmarkOutline, active: false },
            { label: "Create", icon: IoReaderOutline, active: false },
            { label: "Read", icon: IoLibraryOutline, active: false },
            { label: "Profile", icon: IoPersonOutline, active: false },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl px-1 py-2 text-sm font-medium transition ${
                  item.active ? "text-[#3effa2]" : "text-slate-400"
                }`}
              >
                <Icon className="text-2xl leading-none" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
