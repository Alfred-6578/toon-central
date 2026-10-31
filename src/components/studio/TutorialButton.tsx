"use client";

import { IoPlayCircleOutline } from "react-icons/io5";
import { useCreatorTutorial } from "@/lib/creatorTutorial";
import type { StudioMode } from "@/lib/studioModel";

// Sidebar link that runs the creator tutorial (Steps 1–5) again from the start.
export function TutorialButton({ mode }: { mode: StudioMode }) {
  const { restart } = useCreatorTutorial(mode);
  return (
    <button
      type="button"
      onClick={restart}
      className="flex w-full items-center gap-3 whitespace-nowrap border-2 border-transparent px-3 py-2 text-left text-sm font-semibold text-slate-300 hover:border-line hover:text-white"
    >
      <IoPlayCircleOutline className="text-lg" /> Studio tutorial
    </button>
  );
}
