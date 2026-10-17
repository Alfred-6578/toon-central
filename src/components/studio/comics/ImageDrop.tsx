"use client";

import { useRef, useState, type DragEvent } from "react";
import { IoCloudUploadOutline, IoTrashOutline } from "react-icons/io5";
import { storeImage } from "@/lib/imageStore";
import { StudioImage } from "../StudioImage";

type ImageDropProps = {
  label: string;
  hint: string;
  value: string | null;
  onChange: (ref: string | null) => void;
  // Box shape, e.g. "aspect-[3/4]" for covers: the preview shows exactly how it will be cropped.
  aspect: string;
  maxWidth: number;
  className?: string;
};

// One image: click or drop to upload, see it cropped as readers will, replace or remove.
export function ImageDrop({ label, hint, value, onChange, aspect, maxWidth, className = "" }: ImageDropProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const take = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("That isn't an image.");
    setError(null);
    setBusy(true);
    try {
      onChange(await storeImage(file, maxWidth));
    } catch {
      setError("Couldn't read that image. Try a JPG or PNG.");
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
    <div className={className}>
      <p className="mb-1.5 text-sm font-semibold text-slate-200">{label}</p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`relative block w-full overflow-hidden border-2 ${aspect} ${over ? "border-mint" : value ? "border-black" : "border-dashed border-line hover:border-mint"}`}
      >
        {value ? (
          <StudioImage src={value} width={maxWidth} className="absolute inset-0" />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-sm text-slate-400">
            <IoCloudUploadOutline className="text-3xl text-mint" />
            {busy ? "Uploading…" : "Drop an image or click to upload"}
          </span>
        )}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => take(e.target.files?.[0])} />
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className={`text-xs ${error ? "font-semibold text-sun" : "text-slate-500"}`}>{error ?? hint}</p>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white">
            <IoTrashOutline /> Remove
          </button>
        )}
      </div>
    </div>
  );
}
