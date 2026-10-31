"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { IoArrowBack, IoBookOutline, IoCameraOutline, IoCloudUploadOutline, IoImageOutline, IoPause, IoPlay, IoTrashOutline } from "react-icons/io5";
import { formatCount, formatDuration } from "@/lib/format";
import { deleteStoredImage, storeBlob, storeImage, useImageUrl } from "@/lib/imageStore";
import { useMockCreator } from "@/lib/mockCreator";
import {
  CAPTION_MAX,
  MAX_GENRES,
  newId,
  SHORT_MAX_MB,
  SHORT_MAX_SECONDS,
  SHORT_TITLE_MAX,
  shortState,
  studioHref,
  type StudioComic,
  type StudioMode,
  type StudioShort,
} from "@/lib/studioModel";
import { useStudioComics, useStudioShorts } from "@/lib/studioStore";
import { DesktopOnly } from "../StudioGate";
import { StudioImage } from "../StudioImage";

type Props = {
  shortId: string | null;
  mode: StudioMode;
  seeds: StudioShort[];
  comicSeeds: StudioComic[];
  genres: string[];
  demoHandle: string | null;
};

type Release = "now" | "schedule" | "draft";

const toLocalInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Grabs one frame of a video as a JPEG, for the cover.
async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 720 / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no frame"))), "image/jpeg", 0.85));
}

// Reads a video file's length and shape, and a starting cover a quarter of the way in (past title cards).
async function inspectVideo(file: File) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("unreadable"));
    });
    const info = { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
    video.currentTime = Math.min(info.duration * 0.25, 5);
    await new Promise<void>((resolve) => (video.onseeked = () => resolve()));
    const frame = await captureFrame(video).catch(() => null);
    return { ...info, frame };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ShortEditor({ shortId, mode, seeds, comicSeeds, genres, demoHandle }: Props) {
  const router = useRouter();
  const { get, save, remove } = useStudioShorts(mode, seeds);
  const { comics } = useStudioComics(mode, comicSeeds);
  const { profile } = useMockCreator();
  const existing = shortId ? get(shortId) : null;
  const handle = demoHandle ?? profile?.handle ?? "you";
  const back = studioHref("/creator/shorts", mode);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (shortId && !existing) {
    return (
      <div className="border-2 border-dashed border-line px-6 py-12 text-center">
        <p className="font-display text-3xl uppercase text-white">Short not found</p>
        <Link href={back} className="btn btn-primary mt-6 px-6 py-3">Back to shorts</Link>
      </div>
    );
  }

  return (
    <>
      <Link href={back} className="flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-mint">
        <IoArrowBack /> Shorts
      </Link>
      <h1 className="mt-3 font-display text-5xl uppercase leading-[0.9] text-white">{existing ? "Edit short" : "Upload short"}</h1>
      {existing && (
        <p className="mt-2 flex flex-wrap gap-x-4 text-sm text-slate-400">
          <span>{formatCount(existing.views)} views</span>
          <span>{formatCount(existing.likes)} likes</span>
          {existing.live && shortState(existing) === "published" && (
            <Link href={`/shorts?short=${existing.id}`} className="font-semibold text-mint hover:underline">View in the feed</Link>
          )}
        </p>
      )}

      <div className="mt-8">
        <DesktopOnly what="upload or edit shorts">
          <ShortForm
            existing={existing}
            comics={comics}
            genres={genres}
            handle={handle}
            onSave={(short) => {
              save(short);
              router.push(back);
            }}
            onCancel={() => router.push(back)}
          />

          {existing && (
            <section className="mt-12 border-2 border-line p-5">
              <h2 className="font-display text-2xl uppercase text-white">Danger zone</h2>
              {confirmDelete ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-slate-300">Delete &quot;{existing.title}&quot;? Its views and likes go with it.</span>
                  <button
                    type="button"
                    onClick={() => {
                      remove(existing);
                      router.push(back);
                    }}
                    className="border-2 border-black bg-sun px-3 py-1.5 font-bold text-ink shadow-[2px_2px_0_#000]"
                  >
                    Yes, delete
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="font-semibold text-slate-400 hover:text-white">Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="mt-3 text-sm font-semibold text-sun hover:underline">
                  Delete this short…
                </button>
              )}
            </section>
          )}
        </DesktopOnly>
      </div>
    </>
  );
}

type FormProps = {
  existing: StudioShort | null;
  comics: StudioComic[];
  genres: string[];
  handle: string;
  onSave: (short: StudioShort) => void;
  onCancel: () => void;
};

function ShortForm({ existing, comics, genres, handle, onSave, onCancel }: FormProps) {
  const [video, setVideo] = useState(existing?.video ?? null);
  const [cover, setCover] = useState(existing?.cover ?? null);
  const [coverFromVideo, setCoverFromVideo] = useState(false);
  const [duration, setDuration] = useState(existing?.durationSeconds ?? null);
  const [landscape, setLandscape] = useState(false);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [caption, setCaption] = useState(existing?.caption ?? "");
  const [tags, setTags] = useState<string[]>(existing?.genres ?? []);
  const [linkedComicId, setLinkedComicId] = useState(existing?.linkedComicId ?? null);
  const [allowComments, setAllowComments] = useState(existing?.allowComments ?? true);
  const [release, setRelease] = useState<Release>(existing ? (existing.status === "published" ? "now" : existing.status === "scheduled" ? "schedule" : "draft") : "now");
  const [publishAt, setPublishAt] = useState(() =>
    existing?.publishAt ? toLocalInput(new Date(existing.publishAt)) : toLocalInput(new Date(Date.now() + 86_400_000))
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pastDate, setPastDate] = useState(false);
  const videoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const videoUrl = useImageUrl(video);
  const linked = comics.find((c) => c.id === linkedComicId) ?? null;

  const errors = {
    video: release !== "draft" && !video ? "Upload a video to publish or schedule." : null,
    title: !title.trim() ? "Give it a title." : null,
  };

  const takeVideo = async (file: File | undefined) => {
    if (!file) return;
    setVideoError(null);
    if (!file.type.startsWith("video/")) return setVideoError("That isn't a video. MP4, MOV or WebM work.");
    if (file.size > SHORT_MAX_MB * 1024 * 1024) return setVideoError(`That's over ${SHORT_MAX_MB} MB. Export a smaller file and try again.`);
    setBusy("Reading video…");
    try {
      const info = await inspectVideo(file);
      if (info.duration > SHORT_MAX_SECONDS) {
        setVideoError(`Shorts can be up to ${SHORT_MAX_SECONDS / 60} minutes; this one is ${formatDuration(info.duration)}.`);
        return;
      }
      setBusy("Uploading…");
      discard(video);
      setVideo(await storeBlob(file));
      setDuration(info.duration);
      setLandscape(info.width > info.height);
      if (info.frame && !cover) {
        setCover(await storeBlob(info.frame));
        setCoverFromVideo(true);
      }
    } catch {
      setVideoError("Couldn't read that video. Try exporting it as MP4.");
    } finally {
      setBusy(null);
    }
  };

  // Files uploaded during this edit; the saved short's own files stay until it's saved, so Cancel still works.
  const discard = (ref: string | null) => {
    if (ref && ref !== existing?.video && ref !== existing?.cover) deleteStoredImage(ref);
  };

  const removeVideo = () => {
    discard(video);
    // A cover grabbed from this video goes with it; one the creator uploaded separately stays.
    if (coverFromVideo) {
      discard(cover);
      setCover(null);
      setCoverFromVideo(false);
    }
    setVideo(null);
    setDuration(null);
    setLandscape(false);
    setTime(0);
    setPlaying(false);
    setVideoError(null);
  };

  const captureCover = async () => {
    if (!player.current) return;
    setBusy("Saving frame…");
    try {
      const next = await storeBlob(await captureFrame(player.current));
      discard(cover);
      setCover(next);
      setCoverFromVideo(true);
    } finally {
      setBusy(null);
    }
  };

  const submit = () => {
    setSubmitted(true);
    const past = release === "schedule" && Date.parse(publishAt) <= Date.now();
    setPastDate(past);
    if (errors.video || errors.title || past) return;
    onSave({
      id: existing?.id ?? newId(),
      title: title.trim(),
      caption: caption.trim(),
      video,
      cover,
      durationSeconds: duration,
      genres: tags,
      linkedComicId,
      allowComments,
      status: release === "now" ? "published" : release === "schedule" ? "scheduled" : "draft",
      publishAt: release === "schedule" ? new Date(publishAt).toISOString() : null,
      views: existing?.views ?? 0,
      likes: existing?.likes ?? 0,
      updatedAt: new Date().toISOString(),
      live: existing?.live ?? false,
    });
  };

  const input = "w-full border-2 border-line bg-ink px-3 text-base text-white outline-none focus:border-mint";

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="grid content-start gap-6">
        {/* Video */}
        <div>
          <p className="mb-1.5 text-sm font-semibold text-slate-200">Video</p>
          {video ? (
            <div className="flex flex-wrap items-center gap-3 border-2 border-line bg-panel px-4 py-3 text-sm">
              <span className="font-semibold text-white">Video ready</span>
              {duration != null && <span className="text-slate-400">{formatDuration(duration)}</span>}
              {landscape && <span className="text-sun">Landscape: it&apos;ll show with bars. Vertical 9:16 fills the phone screen.</span>}
              <span className="ml-auto flex gap-4">
                <button type="button" onClick={() => videoInput.current?.click()} className="font-semibold text-mint hover:underline">
                  Replace
                </button>
                <button type="button" onClick={removeVideo} className="flex items-center gap-1 font-semibold text-slate-400 hover:text-sun">
                  <IoTrashOutline /> Remove
                </button>
              </span>
            </div>
          ) : (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => videoInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                takeVideo(e.dataTransfer.files[0]);
              }}
              className="flex w-full flex-col items-center gap-2 border-2 border-dashed border-line px-6 py-10 text-sm text-slate-400 hover:border-mint"
            >
              <IoCloudUploadOutline className="text-3xl text-mint" />
              {busy ?? "Drop a video here, or click to choose"}
              <span className="text-xs text-slate-500">Vertical 9:16 · up to {SHORT_MAX_SECONDS / 60} minutes · {SHORT_MAX_MB} MB max</span>
            </button>
          )}
          <input
            ref={videoInput}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => {
              takeVideo(e.target.files?.[0]);
              // Allows choosing the same file again after removing it.
              e.target.value = "";
            }}
          />
          {(videoError || (submitted && errors.video)) && <p className="mt-1.5 text-xs font-semibold text-sun">{videoError ?? errors.video}</p>}
        </div>

        <label className="block">
          <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-200">
            Title <span className="font-normal text-slate-500">{title.length}/{SHORT_TITLE_MAX}</span>
          </span>
          <input value={title} maxLength={SHORT_TITLE_MAX} onChange={(e) => setTitle(e.target.value)} className={`${input} h-11 ${submitted && errors.title ? "border-sun" : ""}`} />
          {submitted && errors.title && <span className="mt-1.5 block text-xs font-semibold text-sun">{errors.title}</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-200">
            Caption <span className="font-normal text-slate-500">{caption.length}/{CAPTION_MAX}</span>
          </span>
          <textarea
            value={caption}
            maxLength={CAPTION_MAX}
            rows={3}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shown under the title when viewers tap “more”."
            className={`${input} py-2.5 placeholder:text-slate-600`}
          />
        </label>

        <fieldset>
          <legend className="mb-2 flex w-full justify-between text-sm font-semibold text-slate-200">
            Hashtags <span className="font-normal text-slate-500">{tags.length}/{MAX_GENRES}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const on = tags.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  aria-pressed={on}
                  disabled={!on && tags.length >= MAX_GENRES}
                  onClick={() => setTags((t) => (on ? t.filter((g) => g !== genre) : [...t, genre]))}
                  className={`border-2 px-2.5 py-1 text-sm font-bold ${
                    on ? "border-black bg-mint text-ink" : "border-line text-slate-300 hover:border-mint disabled:opacity-35 disabled:hover:border-line"
                  }`}
                >
                  #{genre.replace(/[^A-Za-z0-9]+/g, "")}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Viewers tap a hashtag to see more shorts like it.</p>
        </fieldset>

        <div>
          <label className="block max-w-md">
            <span className="mb-1.5 block text-sm font-semibold text-slate-200">Link to a Mafiki</span>
            <select value={linkedComicId ?? ""} onChange={(e) => setLinkedComicId(e.target.value || null)} className={`${input} h-11`}>
              <option value="">No Mafiki</option>
              {comics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                  {c.status === "draft" ? " (draft)" : ""}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-1.5 text-xs text-slate-500">
            {comics.length === 0
              ? "Create a Mafiki first to link it here."
              : "Viewers get a “From the Mafiki” card and a link to read it, and an end card when the short finishes."}
            {linked?.status === "draft" && " The link appears once the Mafiki is published."}
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-200">
          <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} className="h-4 w-4 accent-[var(--color-mint)]" />
          Allow comments
        </label>
      </div>

      {/* Feed preview, cover and release */}
      <aside className="grid content-start gap-6">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-slate-200">How it looks in the feed</p>
          <div className="relative aspect-[9/16] overflow-hidden border-2 border-black bg-black shadow-[5px_5px_0_var(--color-mint-deep)]">
            {videoUrl ? (
              <video
                ref={player}
                src={videoUrl}
                muted
                playsInline
                loop
                onClick={(e) => (e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause())}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                className="h-full w-full cursor-pointer object-contain"
              />
            ) : (
              <StudioImage src={cover} width={400} className="h-full w-full" />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-10">
              {linked && (
                <span className="mb-2 flex w-fit items-center gap-1.5 border-2 border-black bg-paper px-2 py-1 text-[11px] font-bold text-ink">
                  <IoBookOutline /> From the Mafiki · {linked.title}
                </span>
              )}
              <p className="text-xs font-bold text-white">@{handle}</p>
              <p className="truncate text-xs font-semibold text-white">{title || "Your title"}</p>
              {tags.length > 0 && <p className="text-[11px] font-bold text-white">{tags.slice(0, 2).map((t) => `#${t.replace(/[^A-Za-z0-9]+/g, "")}`).join(" ")}</p>}
            </div>
          </div>
        </div>

        {videoUrl && (
          <div className="-mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => (player.current?.paused ? player.current.play() : player.current?.pause())}
              aria-label={playing ? "Pause" : "Play"}
              className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-line text-white hover:border-mint"
            >
              {playing ? <IoPause /> : <IoPlay />}
            </button>
            <input
              type="range"
              min={0}
              max={duration ?? 0}
              step={0.05}
              value={time}
              aria-label="Scrub to a frame"
              onChange={(e) => {
                const t = Number(e.target.value);
                if (player.current) player.current.currentTime = t;
                setTime(t);
              }}
              className="flex-1 accent-[var(--color-mint)]"
            />
            <span className="w-9 shrink-0 text-right text-xs text-slate-400">{formatDuration(time) || "0:00"}</span>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-sm font-semibold text-slate-200">Cover</p>
          <div className="flex items-start gap-3">
            <StudioImage src={cover} width={200} className="aspect-[9/16] w-16 shrink-0 border-2 border-line" />
            <div className="grid gap-2 text-sm">
              <button type="button" disabled={!videoUrl || !!busy} onClick={captureCover} className="flex items-center gap-1.5 text-left font-semibold text-mint hover:underline disabled:text-slate-600 disabled:no-underline">
                <IoCameraOutline /> Use the frame shown above
              </button>
              <button type="button" onClick={() => coverInput.current?.click()} className="flex items-center gap-1.5 text-left font-semibold text-mint hover:underline">
                <IoImageOutline /> Upload an image
              </button>
              {cover && (
                <button
                  type="button"
                  onClick={() => {
                    discard(cover);
                    setCover(null);
                    setCoverFromVideo(false);
                  }}
                  className="flex items-center gap-1.5 text-left font-semibold text-slate-400 hover:text-sun"
                >
                  <IoTrashOutline /> Remove cover
                </button>
              )}
              <p className="text-xs text-slate-500">Scrub to a strong frame, then use it.</p>
            </div>
          </div>
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const next = await storeImage(file, 720);
              discard(cover);
              setCover(next);
              setCoverFromVideo(false);
              e.target.value = "";
            }}
          />
        </div>

        <fieldset className="border-2 border-line bg-panel p-4">
          <legend className="px-1 text-sm font-semibold text-slate-200">Release</legend>
          {(
            [
              ["now", "Publish now"],
              ["schedule", "Schedule"],
              ["draft", "Save as draft"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="mb-2 flex cursor-pointer items-center gap-3 border-2 border-line px-3 py-2 has-[:checked]:border-mint">
              <input type="radio" name="release" checked={release === value} onChange={() => setRelease(value)} className="accent-[var(--color-mint)]" />
              <span className="font-semibold text-white">{label}</span>
            </label>
          ))}
          {release === "schedule" && (
            <>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => {
                  setPublishAt(e.target.value);
                  setPastDate(false);
                }}
                className={`${input} h-11 [color-scheme:dark]`}
              />
              {pastDate && <p className="mt-1.5 text-xs font-semibold text-sun">Pick a time in the future.</p>}
            </>
          )}
          <div className="mt-3 grid gap-2">
            <button type="button" onClick={submit} disabled={!!busy} className="btn btn-primary w-full px-5 py-3 text-base disabled:opacity-50">
              {release === "now" ? "Publish short" : release === "schedule" ? "Schedule short" : "Save draft"}
            </button>
            <button type="button" onClick={onCancel} className="btn btn-ghost w-full px-5 py-2.5 text-sm">Cancel</button>
          </div>
        </fieldset>
      </aside>
    </div>
  );
}
