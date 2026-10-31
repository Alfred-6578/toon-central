"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import { useCreatorTutorial, useMilestoneWatch } from "@/lib/creatorTutorial";
import { newId, reachedMilestone, studioHref, type StudioComic, type StudioMode } from "@/lib/studioModel";
import { useStudioComics } from "@/lib/studioStore";
import { DesktopOnly } from "../StudioGate";
import { ComicForm } from "./ComicForm";

export function NewComic({ mode, seeds, genres }: { mode: StudioMode; seeds: StudioComic[]; genres: string[] }) {
  const router = useRouter();
  const { save, comics } = useStudioComics(mode, seeds);
  const tutorial = useCreatorTutorial(mode);
  // Monetization is for Mafiki created after the 4-episode milestone.
  const eligible = reachedMilestone(comics);
  useMilestoneWatch(mode, comics);

  return (
    <>
      <Link href={studioHref("/creator/comics", mode)} className="flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-mint">
        <IoArrowBack /> Mafiki
      </Link>
      <h1 className="mt-3 font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">New Mafiki</h1>
      <p className="mt-2 text-sm text-slate-400">It starts as a draft. Nobody sees it until you publish.</p>

      <div className="mt-8">
        <DesktopOnly what="create a Mafiki">
          <ComicForm
            initial={{ title: "", synopsis: "", cover: null, banner: null, genres: [], schedule: null, trailer: null, monetization: "none" }}
            genres={genres}
            monetizable={eligible}
            submitLabel="Create draft"
            onSubmit={(details) => {
              const comic: StudioComic = {
                ...details,
                id: newId(),
                status: "draft",
                episodes: [],
                reads: 0,
                likes: 0,
                updatedAt: new Date().toISOString(),
                live: false,
                monetizable: eligible,
              };
              save(comic);
              if (comics.length === 0) tutorial.mafikiCreated(comic.id);
              router.push(studioHref(`/creator/comics/${comic.id}`, mode));
            }}
          />
        </DesktopOnly>
      </div>
    </>
  );
}
