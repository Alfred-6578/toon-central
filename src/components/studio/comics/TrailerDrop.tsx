"use client";

import { useRef, useState, type DragEvent } from "react";
import { IoFilmOutline, IoTrashOutline } from "react-icons/io5";
import { storeBlob, useImageUrl } from "@/lib/imageStore";

export const TRAILER_MAX_SECONDS = 60;
export const TRAILER_MAX_MB = 100;

const readDuration = (file: File) =>
  new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    video.src = url;
  });

// An optional trailer for the Mafiki: a short wide video that plays on its card in the Discover
// main-menu carousel. Click or drop to upload, preview it, replace or remove it.
export function TrailerDrop({ value, onChange }: { value: string | null; onChange: (ref: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const url = useImageUrl(value);

  const take = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("video/")) return setError("That isn't a video. MP4, MOV or WebM work.");
    if (file.size > TRAILER_MAX_MB * 1024 * 1024) return setError(`That's over ${TRAILER_MAX_MB} MB. Export a smaller file.`);
    setBusy(true);
    try {
      const seconds = await readDuration(file);
      if (seconds > TRAILER_MAX_SECONDS + 0.5) return setError(`Trailers can be up to ${TRAILER_MAX_SECONDS} seconds; this one is ${Math.round(seconds)}.`);
      onChange(await storeBlob(file));
    } catch {
      setError("Couldn't read that video. Try an MP4.");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    take(event.dataTransfer.files[0]);
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-slate-200">Trailer (optional)</p>
      {value && url ? (
        <video src={url} controls muted playsInline className="aspect-video w-full max-w-md border-2 border-black bg-black object-cover" />
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={`flex aspect-video w-full max-w-md flex-col items-center justify-center gap-2 border-2 border-dashed p-4 text-center text-sm text-slate-400 ${
            over ? "border-mint" : "border-line hover:border-mint"
          }`}
        >
          <IoFilmOutline className="text-3xl text-mint" />
          {busy ? "Reading video…" : "Drop a trailer video or click to upload"}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="mt-1.5 flex max-w-md items-center justify-between gap-3">
        <p className={`text-xs ${error ? "font-semibold text-sun" : "text-slate-500"}`}>
          {error ?? `Plays on your Mafiki's card in the Discover carousel. Wide (16:9), up to ${TRAILER_MAX_SECONDS} seconds and ${TRAILER_MAX_MB} MB.`}
        </p>
        {value && (
          <span className="flex shrink-0 gap-3">
            <button type="button" onClick={() => input.current?.click()} className="text-xs font-semibold text-slate-400 hover:text-white">
              Replace
            </button>
            <button type="button" onClick={() => onChange(null)} className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white">
              <IoTrashOutline /> Remove
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
