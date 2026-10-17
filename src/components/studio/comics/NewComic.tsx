"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import { newId, studioHref, type StudioComic, type StudioMode } from "@/lib/studioModel";
import { useStudioComics } from "@/lib/studioStore";
import { DesktopOnly } from "../StudioGate";
import { ComicForm } from "./ComicForm";

export function NewComic({ mode, seeds, genres }: { mode: StudioMode; seeds: StudioComic[]; genres: string[] }) {
  const router = useRouter();
  const { save } = useStudioComics(mode, seeds);

  return (
    <>
      <Link href={studioHref("/creator/comics", mode)} className="flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-mint">
        <IoArrowBack /> Comics
      </Link>
      <h1 className="mt-3 font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">New comic</h1>
      <p className="mt-2 text-sm text-slate-400">It starts as a draft. Nobody sees it until you publish.</p>

      <div className="mt-8">
        <DesktopOnly what="create a comic">
          <ComicForm
            initial={{ title: "", synopsis: "", cover: null, banner: null, genres: [], schedule: null }}
            genres={genres}
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
              };
              save(comic);
              router.push(studioHref(`/creator/comics/${comic.id}`, mode));
            }}
          />
        </DesktopOnly>
      </div>
    </>
  );
}
