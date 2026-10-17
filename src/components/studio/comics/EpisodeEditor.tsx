"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { IoArrowBack, IoClose, IoCloudUploadOutline, IoEyeOutline, IoInformationCircleOutline, IoTrashOutline } from "react-icons/io5";
import { storePageImage, UnreadableImageError } from "@/lib/imageStore";
import { FREE_EPISODES } from "@/lib/rules";
import {
  accessOf,
  canMonetize,
  defaultAccess,
  MONETIZE_FROM,
  newId,
  studioHref,
  type EpisodeAccess,
  type StudioComic,
  type StudioEpisode,
  type StudioMode,
} from "@/lib/studioModel";
import { useStudioComics } from "@/lib/studioStore";
import { DesktopOnly } from "../StudioGate";
import { StudioImage } from "../StudioImage";

type Props = { comicId: string; episodeId: string | null; mode: StudioMode; seeds: StudioComic[] };
type Release = "now" | "schedule" | "draft";

// Reader-width pages: wide enough for the reader's 720px column on sharp screens, small enough to store.
const PAGE_WIDTH = 1080;
const MAX_PAGES = 80;

// Creators usually name pages 01.jpg, 02.jpg…; sort uploads that way ("10" after "9").
const byName = (a: File, b: File) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

const toLocalInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function EpisodeEditor({ comicId, episodeId, mode, seeds }: Props) {
  const router = useRouter();
  const { get, save } = useStudioComics(mode, seeds);
  const comic = get(comicId);
  const existing = comic && episodeId ? comic.episodes.find((e) => e.id === episodeId) ?? null : null;

  if (!comic || (episodeId && !existing)) {
    return (
      <div className="border-2 border-dashed border-line px-6 py-12 text-center">
        <p className="font-display text-3xl uppercase text-white">Not found</p>
        <Link href={studioHref("/creator/comics", mode)} className="btn btn-primary mt-6 px-6 py-3">Back to comics</Link>
      </div>
    );
  }

  const number = existing ? comic.episodes.indexOf(existing) + 1 : comic.episodes.length + 1;
  const back = studioHref(`/creator/comics/${comic.id}`, mode);

  return (
    <>
      <Link href={back} className="flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-mint">
        <IoArrowBack /> {comic.title}
      </Link>
      <h1 className="mt-3 font-display text-5xl uppercase leading-[0.9] text-white">{existing ? `Edit episode ${number}` : `Episode ${number}`}</h1>

      <div className="mt-8">
        <DesktopOnly what="upload episodes">
          <EpisodeForm
            number={number}
            existing={existing}
            onSave={(episode) => {
              const episodes = existing ? comic.episodes.map((e) => (e.id === existing.id ? episode : e)) : [...comic.episodes, episode];
              save({ ...comic, episodes });
              router.push(back);
            }}
            onCancel={() => router.push(back)}
          />
        </DesktopOnly>
      </div>
    </>
  );
}

function EpisodeForm({
  number,
  existing,
  onSave,
  onCancel,
}: {
  number: number;
  existing: StudioEpisode | null;
  onSave: (episode: StudioEpisode) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [pages, setPages] = useState<string[]>(existing?.pages ?? []);
  const [access, setAccess] = useState<EpisodeAccess>(existing ? accessOf(existing, number) : defaultAccess());
  // The earning method stays picked if the switch is turned off and on again.
  const [method, setMethod] = useState<"ads" | "credits">(access === "ads" ? "ads" : "credits");
  const monetizable = canMonetize(number);
  const monetized = monetizable && access !== "free";
  const [release, setRelease] = useState<Release>(
    existing ? (existing.status === "published" ? "now" : existing.status === "scheduled" ? "schedule" : "draft") : "now"
  );
  // Default: this time tomorrow.
  const [publishAt, setPublishAt] = useState(() =>
    existing?.publishAt ? toLocalInput(new Date(existing.publishAt)) : toLocalInput(new Date(Date.now() + 86_400_000))
  );
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  // Files that didn't make it, with why, so nothing silently goes missing.
  const [failed, setFailed] = useState<{ name: string; reason: string }[]>([]);
  const [sliced, setSliced] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pastDate, setPastDate] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const errors = {
    pages: release !== "draft" && pages.length === 0 ? "Upload at least one page to publish or schedule." : null,
    publishAt: release === "schedule" && pastDate ? "Pick a time in the future." : null,
  };

  const addFiles = async (files: File[]) => {
    const problems: { name: string; reason: string }[] = files
      .filter((f) => !f.type.startsWith("image/") && !/\.(heic|heif)$/i.test(f.name))
      .map((f) => ({ name: f.name, reason: "not an image" }));
    const images = files.filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)).sort(byName);
    const room = MAX_PAGES - pages.length;
    images.slice(room).forEach((f) => problems.push({ name: f.name, reason: `over the ${MAX_PAGES}-page limit` }));
    const batch = images.slice(0, room);
    if (!batch.length) return setFailed(problems);

    setUploading({ done: 0, total: batch.length });
    const refs: string[] = [];
    let cut = false;
    for (const [i, file] of batch.entries()) {
      try {
        const parts = await storePageImage(file, PAGE_WIDTH);
        if (parts.length > 1) cut = true;
        refs.push(...parts);
      } catch (error) {
        problems.push({ name: file.name, reason: error instanceof UnreadableImageError ? error.message : "couldn't read this file" });
      }
      setUploading({ done: i + 1, total: batch.length });
    }
    setPages((p) => [...p, ...refs].slice(0, MAX_PAGES));
    setFailed(problems);
    if (cut) setSliced(true);
    setUploading(null);
  };

  const submit = () => {
    setSubmitted(true);
    const past = release === "schedule" && Date.parse(publishAt) <= Date.now();
    setPastDate(past);
    if (errors.pages || past) return;
    onSave({
      id: existing?.id ?? newId(),
      title: title.trim() || `Episode ${number}`,
      pages,
      access: monetized ? access : "free",
      status: release === "now" ? "published" : release === "schedule" ? "scheduled" : "draft",
      publishAt: release === "schedule" ? new Date(publishAt).toISOString() : null,
      pagesKnown: true,
    });
  };

  const input = "h-11 w-full border-2 border-line bg-ink px-3 text-base text-white outline-none focus:border-mint";

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="grid content-start gap-6">
        <label className="block max-w-xl">
          <span className="mb-1.5 block text-sm font-semibold text-slate-200">Episode title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Episode ${number}`} maxLength={80} className={`${input} placeholder:text-slate-600`} />
        </label>

        <div>
          <div className="mb-1.5 flex items-end justify-between gap-3">
            <p className="text-sm font-semibold text-slate-200">Pages <span className="font-normal text-slate-500">({pages.length})</span></p>
            {pages.length > 0 && (
              <button type="button" onClick={() => setPreviewing(true)} className="flex items-center gap-1.5 text-sm font-semibold text-mint hover:underline">
                <IoEyeOutline /> Preview as a reader
              </button>
            )}
          </div>
          {existing && !existing.pagesKnown && (
            <p className="mb-3 border-2 border-dashed border-line px-3 py-2 text-xs text-slate-400">
              This episode&apos;s pages are on the live site. Uploading here replaces them in this preview only.
            </p>
          )}
          <PageGrid pages={pages} onChange={setPages} />
          <PageDrop onFiles={addFiles} uploading={uploading} full={pages.length >= MAX_PAGES} />
          {failed.length > 0 && (
            <div role="alert" className="mt-3 border-2 border-sun px-3 py-2.5 text-sm">
              <p className="font-semibold text-sun">
                {failed.length} {failed.length === 1 ? "file wasn't" : "files weren't"} added
              </p>
              <ul className="mt-1 grid gap-0.5 text-xs text-slate-300">
                {failed.map((f) => (
                  <li key={f.name}>
                    <span className="font-semibold text-white">{f.name}</span>: {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sliced && (
            <p className="mt-3 text-xs text-slate-400">Long strips were cut into parts so they load quickly; readers see them as one continuous scroll.</p>
          )}
          <p className={`mt-1.5 text-xs ${submitted && errors.pages ? "font-semibold text-sun" : "text-slate-500"}`}>
            {submitted && errors.pages ? errors.pages : "Tall vertical pages read best. Files are ordered by name (01, 02…); drag to reorder."}
          </p>
        </div>
      </div>

      <aside className="grid content-start gap-6 border-2 border-line bg-panel p-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-200">Monetization</legend>
          <div className="flex items-start gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={monetized}
              aria-label="Monetize this episode"
              disabled={!monetizable}
              onClick={() => setAccess(monetized ? "free" : method)}
              className={`relative mt-0.5 h-7 w-12 shrink-0 border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                monetized ? "border-black bg-mint" : "border-line bg-ink"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 border-2 transition-all ${monetized ? "left-[calc(100%-1.375rem)] border-black bg-ink" : "left-0.5 border-line bg-slate-500"}`}
              />
            </button>
            <div>
              <p className="font-semibold text-white">Monetize this episode?</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-400">
                {monetizable ? (monetized ? "Choose how it earns." : "Off: everyone reads it free.") : `Opens from episode ${MONETIZE_FROM}.`}
              </p>
            </div>
          </div>

          <div className={`mt-3 grid gap-2 ${monetized ? "" : "pointer-events-none opacity-40"}`} aria-disabled={!monetized}>
            {(
              [
                ["ads", "Ads", "Ads appear alongside your episode. Free for readers."],
                ["credits", "Credits", "Readers unlock it with credits, or a pass or plan."],
              ] as const
            ).map(([value, label, body]) => (
              <label key={value} className="flex cursor-pointer items-start gap-3 border-2 border-line px-3 py-2.5 has-[:checked]:border-mint">
                <input
                  type="radio"
                  name="monetize"
                  disabled={!monetized}
                  checked={monetized && access === value}
                  onChange={() => {
                    setMethod(value);
                    setAccess(value);
                  }}
                  className="mt-1 accent-[var(--color-mint)]"
                />
                <span>
                  <span className="block font-semibold text-white">{label}</span>
                  <span className="block text-xs text-slate-400">{body}</span>
                </span>
              </label>
            ))}
          </div>

          {!monetizable && (
            <p className="mt-3 flex gap-2 text-xs leading-5 text-sun">
              <IoInformationCircleOutline className="mt-0.5 shrink-0 text-base" />
              Episodes 1–{FREE_EPISODES} are always free, so new readers can get hooked. Monetization is available from episode {MONETIZE_FROM}.
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-200">Release</legend>
          {(
            [
              ["now", "Publish now"],
              ["schedule", "Schedule"],
              ["draft", "Save as draft"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="mb-2 flex cursor-pointer items-center gap-3 border-2 border-line px-3 py-2.5 has-[:checked]:border-mint">
              <input type="radio" name="release" checked={release === value} onChange={() => setRelease(value)} className="accent-[var(--color-mint)]" />
              <span className="font-semibold text-white">{label}</span>
            </label>
          ))}
          {release === "schedule" && (
            <>
              <input type="datetime-local" value={publishAt} onChange={(e) => {
                  setPublishAt(e.target.value);
                  setPastDate(false);
                }} className={`${input} mt-1 [color-scheme:dark]`} />
              {submitted && errors.publishAt && <p className="mt-1.5 text-xs font-semibold text-sun">{errors.publishAt}</p>}
            </>
          )}
        </fieldset>

        <div className="grid gap-2 border-t-2 border-line pt-5">
          <button type="button" onClick={submit} disabled={!!uploading} className="btn btn-primary w-full px-5 py-3 text-base disabled:opacity-50">
            {release === "now" ? "Publish episode" : release === "schedule" ? "Schedule episode" : "Save draft"}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-ghost w-full px-5 py-2.5 text-sm">Cancel</button>
        </div>
      </aside>

      {previewing && <ReaderPreview pages={pages} title={title || `Episode ${number}`} onClose={() => setPreviewing(false)} />}
    </div>
  );
}

function PageDrop({ onFiles, uploading, full }: { onFiles: (files: File[]) => void; uploading: { done: number; total: number } | null; full: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  if (full) return <p className="mt-3 text-xs text-slate-500">That&apos;s the {MAX_PAGES}-page limit for one episode.</p>;

  return (
    <>
      <button
        type="button"
        disabled={!!uploading}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles([...e.dataTransfer.files]);
        }}
        className={`mt-3 flex w-full flex-col items-center gap-2 border-2 border-dashed px-6 py-8 text-sm text-slate-400 ${over ? "border-mint" : "border-line hover:border-mint"}`}
      >
        <IoCloudUploadOutline className="text-3xl text-mint" />
        {uploading ? `Uploading ${uploading.done} of ${uploading.total}…` : "Drop page images here, or click to choose (you can pick many)"}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
    </>
  );
}

function PageGrid({ pages, onChange }: { pages: string[]; onChange: (pages: string[]) => void }) {
  const [dragging, setDragging] = useState<number | null>(null);
  if (!pages.length) return null;

  const drop = (event: DragEvent, to: number) => {
    event.preventDefault();
    if (dragging === null || dragging === to) return;
    const next = [...pages];
    const [item] = next.splice(dragging, 1);
    next.splice(to, 0, item);
    onChange(next);
    setDragging(null);
  };

  return (
    <ol className="grid grid-cols-4 gap-3 sm:grid-cols-6 xl:grid-cols-8">
      {pages.map((ref, i) => (
        <li
          key={ref}
          draggable
          onDragStart={() => setDragging(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => drop(e, i)}
          onDragEnd={() => setDragging(null)}
          className={`group relative cursor-grab ${dragging === i ? "opacity-40" : ""}`}
        >
          <StudioImage src={ref} width={240} className="aspect-[3/4] w-full border-2 border-line group-hover:border-mint" />
          <span className="absolute left-1 top-1 bg-ink/85 px-1.5 text-xs font-bold text-white">{i + 1}</span>
          <button
            type="button"
            onClick={() => onChange(pages.filter((_, j) => j !== i))}
            aria-label={`Remove page ${i + 1}`}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center border border-black bg-ink/90 text-sm text-white opacity-0 hover:text-sun group-hover:opacity-100"
          >
            <IoTrashOutline />
          </button>
        </li>
      ))}
    </ol>
  );
}

// The pages exactly as the reader shows them: one column, 720px wide, no gaps.
function ReaderPreview({ pages, title, onClose }: { pages: string[]; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Preview of ${title}`} className="fixed inset-0 z-[80] overflow-y-auto bg-ink">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-line bg-ink/95 px-6 py-3">
        <p className="font-display text-xl uppercase text-white">Preview · {title}</p>
        <button type="button" onClick={onClose} className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white">
          <IoClose className="text-xl" /> Close
        </button>
      </div>
      <div className="mx-auto max-w-[720px]">
        {pages.map((ref) => (
          <PreviewPage key={ref} src={ref} />
        ))}
      </div>
    </div>
  );
}

function PreviewPage({ src }: { src: string }) {
  return <StudioImage src={src} width={720} className="min-h-40 w-full [&>img]:h-auto" />;
}
