"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BubbleDots } from "@/components/ui/Loaders";
import { Logo } from "@/components/ui/Logo";
import type { Comic, Genre } from "@/lib/api/types";
import { useRouter } from "next/navigation";
import { cloudinary, genreHref } from "@/lib/format";
import type { DesignChoice } from "@/lib/designOptions";
import { useLocalValue } from "@/lib/localValue";

const SEEN_KEY = "tc-welcome-seen";
const PICKS_KEY = "tc-genre-picks";
// Longest a welcome waits for its images before playing anyway. Panels still loading after that show
// the halftone placeholder until their cover arrives, so nothing ever prints blank.
const READY_TIMEOUT_MS = 6000;
// Same size the homepage hero loads, so the welcome reuses that download (and the image service
// already has it made) instead of asking for a size nothing else uses.
const COVER_WIDTH = 700;
// Same size ComicCard uses, so the homepage's own cards reuse these downloads (and vice versa).
// Crops are done in the browser (object-fit), not as new Cloudinary versions.
const CARD_WIDTH = 500;

type WelcomeProps = {
  variant: DesignChoice<"welcome">;
  // Hero covers, already loading on the homepage.
  covers: Comic[];
  // Every comic we have, for the cover wall.
  catalogue: Comic[];
  genres: Genre[];
  // ?intro=1: replay for demos, every time.
  force?: boolean;
};

// First-visit welcome on the homepage, in three styles the client can compare (Design options → Welcome
// screen). Shown once per browser. It sits over the already-rendered homepage, so it never delays the
// page or hides it from search engines, and links straight to a comic or short never see it.
export function WelcomeScreen({ variant, covers, catalogue, genres, force = false }: WelcomeProps) {
  // Server and first paint say "seen", so nothing flashes before we know.
  const [seen, setSeen] = useLocalValue(SEEN_KEY, "0", "1");
  const [closedReplay, setClosedReplay] = useState(false);
  const open = force ? !closedReplay : seen !== "1";

  const close = () => {
    setSeen("1");
    setClosedReplay(true);
  };

  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
    // close only depends on setters that never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || covers.length < 4) return null;

  if (variant === "voices") return <VoicesWelcome catalogue={catalogue} onClose={close} />;
  if (variant === "zoom") return <PullBackWelcome covers={covers} catalogue={catalogue} onClose={close} />;
  if (variant === "wall") return <WallWelcome catalogue={catalogue} genres={genres} onClose={close} />;
  return <PageWelcome covers={covers} onClose={close} />;
}

// Waits for images to download (or a timeout), so an animation never plays over blank pictures.
function useImagesReady(urls: string[]) {
  const [ready, setReady] = useState(false);
  const key = urls.join("|");

  useEffect(() => {
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const timeout = setTimeout(start, READY_TIMEOUT_MS);
    Promise.all(
      key.split("|").map(
        (src) =>
          new Promise<void>((resolve) => {
            const image = new Image();
            image.onload = image.onerror = () => resolve();
            image.src = src;
          })
      )
    ).then(start);
    return () => clearTimeout(timeout);
  }, [key]);

  return ready;
}

function useFocusWhen(ready: boolean, delaySeconds: number) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => ref.current?.focus({ preventScroll: true }), delaySeconds * 1000);
    return () => clearTimeout(timer);
  }, [ready, delaySeconds]);
  return ref;
}

function Shell({ ready, labelledBy, className = "bg-ink", children }: { ready: boolean; labelledBy: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      data-welcome-ready={ready}
      className={`fixed inset-0 z-[100] overflow-y-auto ${className}`}
    >
      {children}
    </div>
  );
}

function SkipButton({ onClose, delay = 0.6 }: { onClose: () => void; delay?: number }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="welcome-rise absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 text-sm font-semibold text-slate-300 underline-offset-4 drop-shadow hover:text-white hover:underline sm:right-6"
      style={{ animationDelay: `${delay}s` }}
    >
      Skip
    </button>
  );
}

/* ─── A. Comic page: panels print with real covers, then a speech bubble ─────────────────────────── */

const PANELS = ["row-span-2", "", "", "col-span-2"];
const PANEL_DELAY = (i: number) => 0.25 + i * 0.22;
const BUBBLE_DELAY = 1.25;
const OUTRO_DELAY = 1.55;

function PageWelcome({ covers, onClose }: { covers: Comic[]; onClose: () => void }) {
  const urls = covers.slice(0, PANELS.length).map((c) => cloudinary(c.coverImage, COVER_WIDTH));
  const ready = useImagesReady(urls);
  const startRef = useFocusWhen(ready, OUTRO_DELAY + 0.4);

  return (
    <Shell ready={ready} labelledBy="welcome-title">
      <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-[60vh]" aria-hidden="true" />
      <SkipButton onClose={onClose} />

      <div className="relative mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-8 px-6 py-14">
        <div className="relative w-[min(78vw,20rem,40vh)]" aria-hidden="true">
          {!ready && (
            <span className="absolute inset-0 z-10 flex items-center justify-center">
              <BubbleDots label="Getting things ready" className="text-ink" tailClassName="bg-white" />
            </span>
          )}
          <div className="grid aspect-[4/5] grid-cols-2 grid-rows-3 gap-2 border-[3px] border-black bg-paper p-2 shadow-[7px_7px_0_#000]">
            {urls.map((src, i) => (
              <div key={src} className={`halftone-sweep overflow-hidden border-[3px] border-black ${PANELS[i]}`}>
                <img src={src} alt="" className="panel-print h-full w-full object-cover object-[50%_25%]" style={{ animationDelay: `${PANEL_DELAY(i)}s` }} />
              </div>
            ))}
          </div>

          <div
            className="bubble-pop absolute -right-5 -top-7 max-w-[11.5rem] border-[3px] border-black bg-white px-4 py-3 text-ink shadow-[4px_4px_0_#000] sm:-right-10"
            style={{ animationDelay: `${BUBBLE_DELAY}s` }}
          >
            <p id="welcome-title" className="font-display text-xl uppercase leading-none sm:text-2xl">
              Welcome to the home of Mafiki
            </p>
            <span className="absolute -bottom-[12px] left-6 h-5 w-5 rotate-45 border-b-[3px] border-r-[3px] border-black bg-white" />
          </div>
        </div>

        <div className="welcome-rise flex flex-col items-center gap-2 text-center" style={{ animationDelay: `${OUTRO_DELAY}s` }}>
          <Logo className="w-32 text-mint" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Giving Africa a voice</p>
        </div>

        <div className="welcome-rise flex w-full flex-col gap-3 sm:flex-row sm:justify-center" style={{ animationDelay: `${OUTRO_DELAY + 0.15}s` }}>
          <button ref={startRef} type="button" onClick={onClose} className="btn btn-primary px-6 py-3 text-base">
            Start reading
          </button>
          <Link href="/shorts" onClick={onClose} className="btn btn-ghost px-6 py-3 text-base">
            Watch shorts
          </Link>
        </div>
      </div>
    </Shell>
  );
}

/* ─── B. Many voices: characters from real covers say welcome across Africa's languages ────────────── */

// Greetings to confirm with native speakers before launch (spelling and tone marks especially).
const GREETINGS = [
  { word: "Akwaaba", language: "Twi" },
  { word: "Karibu", language: "Swahili" },
  { word: "Ẹ kú àbọ̀", language: "Yoruba" },
  { word: "Nnọọ", language: "Igbo" },
  { word: "Barka da zuwa", language: "Hausa" },
  { word: "Siyakwamukela", language: "Zulu" },
  { word: "Bienvenue", language: "French" },
  { word: "Marhaba", language: "Arabic" },
];
const VOICE_STEP = 0.28;
const VOICES_OUTRO = 0.4 + GREETINGS.length * VOICE_STEP + 0.2;

function VoicesWelcome({ catalogue, onClose }: { catalogue: Comic[]; onClose: () => void }) {
  // One character per greeting: the most-read covers, cropped close on the art.
  const faces = catalogue.slice(0, GREETINGS.length).map((c) => cloudinary(c.coverImage, CARD_WIDTH));
  const ready = useImagesReady(faces);
  const startRef = useFocusWhen(ready, VOICES_OUTRO + 0.4);

  return (
    <Shell ready={ready} labelledBy="welcome-title">
      <div className="halftone-fade pointer-events-none absolute inset-x-0 top-0 h-[60vh]" aria-hidden="true" />
      <SkipButton onClose={onClose} />

      <div className="relative mx-auto flex min-h-full max-w-4xl flex-col items-center justify-center gap-6 px-5 py-12 sm:gap-8 sm:py-14">
        {!ready && <BubbleDots label="Getting things ready" className="text-mint" />}

        {/* The chorus: panels print one by one, each character's bubble pops as it appears. */}
        <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-5 pt-4 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-8" aria-hidden="true">
          {faces.map((src, i) => (
            <li key={src} className="relative">
              <div className="halftone-sweep overflow-hidden border-[3px] border-black shadow-[4px_4px_0_#000]">
                <img src={src} alt="" className="panel-print aspect-[2/1] w-full object-cover object-[50%_20%] sm:aspect-[6/5]" style={{ animationDelay: `${0.4 + i * VOICE_STEP}s` }} />
              </div>
              <div
                className={`bubble-pop absolute -top-4 max-w-[85%] border-2 border-black bg-white px-2 py-1 sm:-top-5 sm:px-2.5 sm:py-1.5 text-ink shadow-[2px_2px_0_#000] ${i % 2 ? "right-1" : "left-1"}`}
                style={{ animationDelay: `${0.55 + i * VOICE_STEP}s` }}
              >
                <p className="font-display text-sm uppercase leading-none sm:text-lg">{GREETINGS[i].word}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-ink/50">{GREETINGS[i].language}</p>
                <span className={`absolute -bottom-[8px] h-3.5 w-3.5 rotate-45 border-b-2 border-r-2 border-black bg-white ${i % 2 ? "right-4" : "left-4"}`} />
              </div>
            </li>
          ))}
        </ul>

        <div className="welcome-rise flex flex-col items-center gap-2 text-center" style={{ animationDelay: `${VOICES_OUTRO}s` }}>
          <h2 id="welcome-title" className="font-display text-4xl uppercase leading-[0.9] text-white sm:text-6xl">
            Welcome to Toon Central
          </h2>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">Giving Africa a voice</p>
        </div>

        <div className="welcome-rise flex w-full flex-col gap-3 sm:flex-row sm:justify-center" style={{ animationDelay: `${VOICES_OUTRO + 0.15}s` }}>
          <button ref={startRef} type="button" onClick={onClose} className="btn btn-primary px-6 py-3 text-base">
            Start reading
          </button>
          <Link href="/shorts" onClick={onClose} className="btn btn-ghost px-6 py-3 text-base">
            Watch shorts
          </Link>
        </div>
      </div>
    </Shell>
  );
}

/* ─── C. Pull back: one cover fills the screen, then zooms out into the whole catalogue ─────────────── */

// Odd counts so one cell sits dead centre: that's the cover the zoom starts on.
const GRID = { phone: { cols: 5, rows: 7 }, desktop: { cols: 9, rows: 5 } };
const PULL_MS = 1700;

function PullBackWelcome({ covers, catalogue, onClose }: { covers: Comic[]; catalogue: Comic[]; onClose: () => void }) {
  const hero = covers[0];
  const heroArt = cloudinary(hero.coverImage, COVER_WIDTH);
  const ready = useImagesReady([heroArt]);
  const startRef = useFocusWhen(ready, PULL_MS / 1000 + 0.8);
  const gridRef = useRef<HTMLDivElement>(null);

  // How far to zoom in so the centre cover fills the screen; the animation then eases back to 1.
  useEffect(() => {
    const grid = gridRef.current;
    // Two grids exist (phone, desktop); measure the one on screen.
    const cell = [...(grid?.querySelectorAll<HTMLElement>("[data-centre]") ?? [])].find((el) => el.offsetWidth > 0);
    if (!grid || !cell) return;
    const scale = Math.max(window.innerWidth / cell.offsetWidth, window.innerHeight / cell.offsetHeight) * 1.02;
    grid.style.setProperty("--zoom-from", String(scale));
  }, []);

  const others = catalogue.filter((c) => c.uuid !== hero.uuid);
  const cell = (n: number) => others[n % others.length];

  const renderGrid = (layout: keyof typeof GRID, className: string) => {
    const { cols, rows } = GRID[layout];
    const total = cols * rows;
    const centre = Math.floor(total / 2);
    return (
      <div
        className={`grid gap-2.5 ${className}`}
        style={{ gridTemplateColumns: `repeat(${cols}, var(--cell))` }}
      >
        {Array.from({ length: total }, (_, i) =>
          i === centre ? (
            <img key="centre" data-centre={layout} src={heroArt} alt="" className="aspect-[3/4] w-full border-[3px] border-black object-cover" />
          ) : (
            // Tiles still loading show the halftone placeholder rather than a black square.
            <div key={i} className="halftone-sweep aspect-[3/4] border-[3px] border-black">
              <img src={cloudinary(cell(i).coverImage, CARD_WIDTH)} alt="" className="h-full w-full object-cover" />
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <Shell ready={ready} labelledBy="welcome-title" className="overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          ref={gridRef}
          className="pull-back absolute left-1/2 top-1/2 w-max [--cell:28vw] sm:[--cell:11vw]"
          style={{ animationDuration: `${PULL_MS}ms` }}
        >
          {renderGrid("phone", "sm:hidden")}
          {renderGrid("desktop", "hidden sm:grid")}
        </div>
        <div className="fade-in-late absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,11,20,0.55),rgba(7,11,20,0.92)_75%)]" style={{ animationDelay: `${PULL_MS / 1000 - 0.2}s` }} />
      </div>

      <SkipButton onClose={onClose} delay={0.8} />
      {!ready && (
        <span className="absolute inset-0 z-10 flex items-center justify-center">
          <BubbleDots label="Getting things ready" className="text-mint" />
        </span>
      )}

      <div className="relative flex min-h-full items-center justify-center px-5 py-16">
        <div
          className="welcome-rise w-full max-w-md border-[3px] border-black bg-ink p-6 text-center shadow-[8px_8px_0_#000] sm:p-8"
          style={{ animationDelay: `${PULL_MS / 1000 + 0.1}s` }}
        >
          <Logo className="mx-auto w-36 text-mint" />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">Giving Africa a voice</p>
          <h2 id="welcome-title" className="mt-6 font-display text-4xl uppercase leading-[0.95] text-white">
            Every story here is African
          </h2>
          <p className="mt-2 text-sm text-slate-400">Comics and animated shorts from creators across the continent.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button ref={startRef} type="button" onClick={onClose} className="btn btn-primary px-6 py-3 text-base">
              Start reading
            </button>
            <Link href="/shorts" onClick={onClose} className="btn btn-ghost px-6 py-3 text-base">
              Watch shorts
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ─── D. Cover wall: the catalogue drifting past, with a pick-your-genres card ─────────────────────── */

const MAX_PICKS = 3;

function WallWelcome({ catalogue, genres, onClose }: { catalogue: Comic[]; genres: Genre[]; onClose: () => void }) {
  const covers = catalogue.slice(0, 20);
  const ready = useImagesReady(covers.slice(0, 6).map((c) => cloudinary(c.coverImage, CARD_WIDTH)));
  const continueRef = useFocusWhen(ready, 1);
  const router = useRouter();
  const [, setSavedPicks] = useLocalValue(PICKS_KEY, "[]");
  const [picks, setPicks] = useState<string[]>([]);

  // The genres with the most comics, so every chip leads somewhere.
  const choices = genres.filter((g) => catalogue.some((c) => c.genres.includes(g.name)))
    .sort((a, b) => catalogue.filter((c) => c.genres.includes(b.name)).length - catalogue.filter((c) => c.genres.includes(a.name)).length)
    .slice(0, 10);

  const toggle = (name: string) =>
    setPicks((current) => (current.includes(name) ? current.filter((p) => p !== name) : current.length < MAX_PICKS ? [...current, name] : current));

  // Picks are kept for future recommendations; for now the reader starts in their first pick.
  const finish = () => {
    if (picks.length) {
      setSavedPicks(JSON.stringify(picks));
      router.push(genreHref(picks[0]));
    }
    onClose();
  };

  // Five rows (enough to fill a tall phone screen), each its own slice of covers, repeated so the
  // drift loops seamlessly.
  const rows = [0, 1, 2, 3, 4].map((r) => covers.filter((_, i) => i % 5 === r));

  return (
    <Shell ready={ready} labelledBy="welcome-title">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -inset-x-24 top-1/2 flex -translate-y-1/2 -rotate-6 flex-col gap-4 opacity-60">
          {rows.map((row, r) => (
            <div key={r} className={`cover-drift flex w-max gap-4 ${r % 2 ? "cover-drift-reverse" : ""}`}>
              {[...row, ...row, ...row, ...row].map((comic, i) => (
                <div key={`${comic.uuid}-${i}`} className="halftone-sweep aspect-[3/4] w-28 shrink-0 border-[3px] border-black sm:w-36">
                  <img src={cloudinary(comic.coverImage, CARD_WIDTH)} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,11,20,0.45),rgba(7,11,20,0.9)_80%)]" />
      </div>

      <SkipButton onClose={onClose} />

      <div className="relative flex min-h-full items-center justify-center px-5 py-16">
        <div className="welcome-rise w-full max-w-md border-[3px] border-black bg-ink p-6 shadow-[8px_8px_0_#000] sm:p-8" style={{ animationDelay: "0.3s" }}>
          <Logo className="w-32 text-mint" />
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">Giving Africa a voice</p>

          <h2 id="welcome-title" className="mt-6 font-display text-4xl uppercase leading-[0.95] text-white">
            What are you into?
          </h2>
          <p className="mt-2 text-sm text-slate-400">Pick up to {MAX_PICKS} and we&apos;ll start you off there.</p>

          <ul className="mt-5 flex flex-wrap gap-2">
            {choices.map((genre, i) => {
              const on = picks.includes(genre.name);
              const full = !on && picks.length >= MAX_PICKS;
              return (
                <li key={genre.id} className="welcome-rise" style={{ animationDelay: `${0.55 + i * 0.05}s` }}>
                  <button
                    type="button"
                    onClick={() => toggle(genre.name)}
                    aria-pressed={on}
                    disabled={full}
                    className={`border-2 px-3 py-1.5 font-display text-base uppercase leading-none transition-colors ${
                      on ? "border-black bg-mint text-ink shadow-[3px_3px_0_#000]" : "border-line text-slate-200 hover:border-mint disabled:opacity-40 disabled:hover:border-line"
                    }`}
                  >
                    {genre.name}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button ref={continueRef} type="button" onClick={finish} className="btn btn-primary px-6 py-3 text-base">
              {picks.length ? `Start with ${picks[0]}` : "Start exploring"}
            </button>
            <span className="text-xs text-slate-500">{picks.length}/{MAX_PICKS} picked</span>
          </div>
        </div>
      </div>
    </Shell>
  );
}
