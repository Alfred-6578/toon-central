"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";
import { IoAdd, IoArrowBack, IoArrowDown, IoArrowUp, IoCheckmark, IoLinkOutline, IoLockClosed, IoMegaphoneOutline, IoReorderTwo } from "react-icons/io5";
import { comicHref, formatCount } from "@/lib/format";
import { FREE_EPISODES } from "@/lib/rules";
import {
  adsOn,
  adSpotsOf,
  canMonetize,
  episodeState,
  MONETIZE_FROM,
  lockedOnSite,
  lockedPanelsOf,
  studioHref,
  type StudioComic,
  type StudioEpisode,
  type StudioMode,
} from "@/lib/studioModel";
import { useMilestoneWatch } from "@/lib/creatorTutorial";
import { useStudioComics } from "@/lib/studioStore";
import { DesktopOnly } from "../StudioGate";
import { StudioImage } from "../StudioImage";
import { AdSpaces } from "./AdSpaces";
import { ComicForm } from "./ComicForm";
import { STATUS_TAG } from "./ComicsList";

type Props = { id: string; mode: StudioMode; seeds: StudioComic[]; genres: string[] };

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function ComicEditor({ id, mode, seeds, genres }: Props) {
  const router = useRouter();
  const { get, save, remove, comics } = useStudioComics(mode, seeds);
  const comic = get(id);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  useMilestoneWatch(mode, comics);

  if (!comic) {
    return (
      <div className="border-2 border-dashed border-line px-6 py-12 text-center">
        <p className="font-display text-3xl uppercase text-white">Mafiki not found</p>
        <p className="mt-2 text-sm text-slate-400">It may have been deleted, or created in another browser.</p>
        <Link href={studioHref("/creator/comics", mode)} className="btn btn-primary mt-6 px-6 py-3">Back to Mafiki</Link>
      </div>
    );
  }

  const update = (patch: Partial<StudioComic>) => save({ ...comic, ...patch });
  const setEpisodes = (episodes: StudioEpisode[]) => update({ episodes });
  const setAds = (episodeId: string, ads: boolean) => setEpisodes(comic.episodes.map((e) => (e.id === episodeId ? { ...e, ads } : e)));
  const withLocks = comic.episodes.filter((e, i) => lockedPanelsOf(comic, i + 1, e).length > 0 || lockedOnSite(comic, i + 1, e)).length;
  const withAds = comic.episodes.filter((e, i) => adsOn(comic, i + 1, e)).length;
  const live = comic.episodes.filter((e) => episodeState(e) !== "draft").length;
  const tag = STATUS_TAG[comic.status];

  const move = (from: number, to: number) => {
    if (to < 0 || to >= comic.episodes.length || from === to) return;
    const next = [...comic.episodes];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setEpisodes(next);
  };

  return (
    <>
      <Link href={studioHref("/creator/comics", mode)} className="flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-mint">
        <IoArrowBack /> Mafiki
      </Link>

      {editing ? (
        <div className="mt-4">
          <h1 className="mb-8 font-display text-[2.5rem] uppercase leading-[0.9] text-white sm:text-5xl">Edit details</h1>
          <ComicForm
            initial={comic}
            genres={genres}
            submitLabel="Save changes"
            onSubmit={(details) => {
              update(details);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <header className="mt-4 flex flex-col gap-6 border-b-2 border-line pb-8 sm:flex-row">
            <StudioImage src={comic.cover} width={400} className="aspect-[3/4] w-32 shrink-0 border-2 border-black shadow-[4px_4px_0_#000] sm:w-40" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`tag ${tag.className}`}>{tag.label}</span>
                {comic.genres.map((g) => (
                  <span key={g} className="text-xs text-slate-400">{g}</span>
                ))}
              </div>
              <h1 className="mt-2 break-words font-display text-4xl uppercase leading-[0.9] text-white sm:text-5xl">{comic.title}</h1>
              <p className="mt-3 line-clamp-3 max-w-2xl text-sm leading-6 text-slate-300">{comic.synopsis}</p>
              <p className="mt-3 text-xs text-slate-500">
                {formatCount(comic.reads)} reads · {formatCount(comic.likes)} likes{comic.schedule && ` · updates ${comic.schedule}s`}
                {" · "}
                <span className={withLocks + withAds ? "font-semibold text-mint" : ""}>
                  {withLocks + withAds
                    ? [withLocks && `${withLocks} with locked panels`, withAds && `${withAds} with ads`].filter(Boolean).join(", ")
                    : "every episode free"}
                </span>
                {adSpotsOf(comic).length > 0 && ` · ${adSpotsOf(comic).length} ad ${adSpotsOf(comic).length === 1 ? "space" : "spaces"}`}
              </p>

              <div className="mt-5 hidden flex-wrap gap-3 lg:flex">
                <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost px-4 py-2 text-sm">Edit details</button>
                {comic.status === "draft" ? (
                  <button
                    type="button"
                    disabled={live === 0}
                    onClick={() => update({ status: "published" })}
                    title={live === 0 ? "Publish or schedule an episode first" : undefined}
                    className="btn btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Publish Mafiki
                  </button>
                ) : comic.status === "published" ? (
                  <button type="button" onClick={() => update({ status: "completed" })} className="btn btn-ghost px-4 py-2 text-sm">Mark completed</button>
                ) : (
                  <button type="button" onClick={() => update({ status: "published" })} className="btn btn-ghost px-4 py-2 text-sm">Reopen as ongoing</button>
                )}
                {comic.live && (
                  <Link href={comicHref(comic.id)} className="btn btn-ghost px-4 py-2 text-sm">View public page</Link>
                )}
                <ShareLink comic={comic} />
              </div>
              {comic.status === "draft" && live === 0 && (
                <p className="mt-3 hidden text-xs text-slate-500 lg:block">Add an episode and publish or schedule it, then publish the Mafiki.</p>
              )}
            </div>
          </header>

          <section aria-labelledby="episodes-title" className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="episodes-title" className="font-display text-3xl uppercase leading-none text-white">Episodes</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Episodes 1–{FREE_EPISODES} are always free. From episode {FREE_EPISODES + 1}, switch on ads for an episode, and lock any
                  of its panels in the episode editor: readers unlock them with credits. Drag to reorder.
                </p>
              </div>
              <Link
                href={studioHref(`/creator/comics/${comic.id}/episodes/new`, mode)}
                data-tour="upload-chapter"
                className="btn btn-primary hidden gap-2 px-4 py-2 text-sm lg:inline-flex"
              >
                <IoAdd /> Add episode
              </Link>
            </div>

            {comic.episodes.length === 0 ? (
              <div className="border-2 border-dashed border-line px-6 py-10 text-center text-sm text-slate-400">
                No episodes yet.{" "}
                <Link href={studioHref(`/creator/comics/${comic.id}/episodes/new`, mode)} className="hidden font-semibold text-mint hover:underline lg:inline">
                  Upload your first one
                </Link>
              </div>
            ) : (
              <EpisodeList
                comic={comic}
                mode={mode}
                onMove={move}
                onAds={setAds}
                confirmDelete={confirmDelete}
                onAskDelete={setConfirmDelete}
                onDelete={(episodeId) => {
                  setEpisodes(comic.episodes.filter((e) => e.id !== episodeId));
                  setConfirmDelete(null);
                }}
              />
            )}
          </section>

          <AdSpaces comic={comic} onChange={(adSpots) => update({ adSpots })} />

          <DesktopOnly what="add or edit episodes">
            <section className="mt-12 border-2 border-line p-5">
              <h2 className="font-display text-2xl uppercase text-white">Danger zone</h2>
              {confirmDelete === "comic" ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-slate-300">Delete &quot;{comic.title}&quot; and all {comic.episodes.length} episodes?</span>
                  <button
                    type="button"
                    onClick={() => {
                      remove(comic);
                      router.push(studioHref("/creator/comics", mode));
                    }}
                    className="border-2 border-black bg-sun px-3 py-1.5 font-bold text-ink shadow-[2px_2px_0_#000]"
                  >
                    Yes, delete
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(null)} className="font-semibold text-slate-400 hover:text-white">Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete("comic")} className="mt-3 text-sm font-semibold text-sun hover:underline">
                  Delete this Mafiki…
                </button>
              )}
            </section>
          </DesktopOnly>
        </>
      )}
    </>
  );
}


// Copies the Mafiki's public link, to share on social media (Step 5 of the creator tutorial).
function ShareLink({ comic }: { comic: StudioComic }) {
  const [copied, setCopied] = useState<"yes" | "no" | null>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${comicHref(comic.id)}`);
      setCopied("yes");
    } catch {
      setCopied("no");
    }
    setTimeout(() => setCopied(null), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      data-tour="share"
      title={comic.status === "draft" ? "The link works for readers once the Mafiki is published" : undefined}
      className="btn btn-ghost gap-2 px-4 py-2 text-sm"
    >
      {copied === "yes" ? <IoCheckmark /> : <IoLinkOutline />}
      {copied === "yes" ? "Link copied" : copied === "no" ? "Couldn't copy" : "Copy link"}
    </button>
  );
}

// Ads on or off for one episode (from episode 4). Saved straight away.
function AdsToggle({ on, onChange, label, tour }: { on: boolean; onChange: (on: boolean) => void; label: string; tour?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      aria-label={`Ads in ${label}`}
      title={on ? "Ads show alongside this episode. Tap to turn them off." : "Show ads alongside this episode. It stays free to read."}
      data-tour={tour}
      className={`flex shrink-0 items-center gap-1 border-2 px-2 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
        on ? "border-black bg-paper text-ink" : "border-line text-slate-400 hover:text-white"
      }`}
    >
      <IoMegaphoneOutline aria-hidden="true" /> {on ? "Ads on" : "Ads off"}
    </button>
  );
}

type ListProps = {
  comic: StudioComic;
  mode: StudioMode;
  onMove: (from: number, to: number) => void;
  onAds: (episodeId: string, ads: boolean) => void;
  confirmDelete: string | null;
  onAskDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
};

function EpisodeList({ comic, mode, onMove, onAds, confirmDelete, onAskDelete, onDelete }: ListProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const drop = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (dragging !== null) onMove(dragging, index);
    setDragging(null);
    setOver(null);
  };

  return (
    <ol className="grid gap-2">
      {comic.episodes.map((episode, i) => {
        const state = episodeState(episode);
        const locked = lockedPanelsOf(comic, i + 1, episode);
        const editHref = studioHref(`/creator/comics/${comic.id}/episodes/${episode.id}`, mode);
        const deleting = confirmDelete === episode.id;
        return (
          <li
            key={episode.id}
            draggable
            onDragStart={() => setDragging(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(i);
            }}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            onDrop={(e) => drop(e, i)}
            className={`flex flex-wrap items-center gap-3 border-2 bg-panel px-3 py-2.5 sm:flex-nowrap ${
              over === i && dragging !== i ? "border-mint" : "border-line"
            } ${dragging === i ? "opacity-50" : ""}`}
          >
            <IoReorderTwo className="hidden shrink-0 cursor-grab text-xl text-slate-500 lg:block" aria-hidden="true" />
            <span className="w-8 shrink-0 text-center font-display text-2xl leading-none text-slate-300">{i + 1}</span>
            <StudioImage src={episode.thumbnail ?? episode.pages[0] ?? comic.cover} width={120} className="aspect-[3/4] w-9 shrink-0 border-2 border-line" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{episode.title || `Episode ${i + 1}`}</p>
              <p className="text-xs text-slate-400">
                {state === "published" && "Published"}
                {state === "scheduled" && episode.publishAt && <span className="text-sun">Goes live {when(episode.publishAt)}</span>}
                {state === "draft" && "Draft"}
                {" · "}
                {episode.pagesKnown
                  ? `${episode.pages.length} ${episode.pages.length === 1 ? "page" : "pages"}`
                  : mode === "live"
                    ? "open to see its pages"
                    : "pages on the live site"}
              </p>
            </div>

            {canMonetize(i + 1) ? (
              <div className="flex shrink-0 items-center gap-2">
                {lockedOnSite(comic, i + 1, episode) ? (
                  <span className="tag flex items-center gap-1 bg-sun" title="The live site locks this episode's panels">
                    <IoLockClosed aria-hidden="true" /> Locked on site
                  </span>
                ) : locked.length > 0 ? (
                  <Link href={editHref} className="tag flex items-center gap-1 bg-sun hover:-translate-y-px" title="Change which panels are locked">
                    <IoLockClosed aria-hidden="true" /> {locked.length} of {episode.pages.length} locked
                  </Link>
                ) : (
                  <Link href={editHref} className="hidden items-center gap-1 text-xs font-semibold text-slate-400 hover:text-sun lg:flex">
                    <IoLockClosed aria-hidden="true" /> Lock panels
                  </Link>
                )}
                <AdsToggle
                  on={adsOn(comic, i + 1, episode)}
                  onChange={(on) => onAds(episode.id, on)}
                  label={episode.title || `Episode ${i + 1}`}
                  // The tutorial's "earn from episode 4" step points at the first episode that can earn.
                  tour={i + 1 === MONETIZE_FROM ? "monetize" : undefined}
                />
              </div>
            ) : (
              <span className="tag shrink-0 bg-mint" title={`Episodes 1–${FREE_EPISODES} are always free`}>
                Free
              </span>
            )}

            <div className="hidden shrink-0 items-center gap-1 lg:flex">
              <button type="button" onClick={() => onMove(i, i - 1)} disabled={i === 0} aria-label="Move up" className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30">
                <IoArrowUp />
              </button>
              <button
                type="button"
                onClick={() => onMove(i, i + 1)}
                disabled={i === comic.episodes.length - 1}
                aria-label="Move down"
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
              >
                <IoArrowDown />
              </button>
              <Link href={studioHref(`/creator/comics/${comic.id}/episodes/${episode.id}`, mode)} className="ml-2 text-sm font-semibold text-mint hover:underline">
                Edit
              </Link>
              {deleting ? (
                <span className="ml-3 flex items-center gap-2 text-sm">
                  <button type="button" onClick={() => onDelete(episode.id)} className="font-bold text-sun hover:underline">Delete</button>
                  <button type="button" onClick={() => onAskDelete(null)} className="text-slate-400 hover:text-white">Keep</button>
                </span>
              ) : (
                <button type="button" onClick={() => onAskDelete(episode.id)} className="ml-3 text-sm text-slate-500 hover:text-sun">
                  Delete
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
