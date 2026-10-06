"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cloudinaryVideo } from "@/lib/format";

const PREVIEW_DELAY_MS = 300;
// Previews loop a silent 8-second excerpt from a quarter of the way in, past title cards and intros.
export const PREVIEW_CLIP = { start: "25p", length: 8 } as const;
// Cloudinary builds each trimmed clip on its first request, and that first response is an empty
// (0-second) video rather than an error. So an empty or failed clip is retried a few times.
const RETRY_MS = 2500;
const MAX_RETRIES = 4;

// A muted looping clip that stays invisible until it's actually playing, retrying while Cloudinary
// builds it. Sits over a cover image, so nothing looks broken in the meantime.
export function PreviewVideo({ src, className = "" }: { src: string; className?: string }) {
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (retry.current) clearTimeout(retry.current);
    },
    []
  );

  const scheduleRetry = () => {
    if (attempt >= MAX_RETRIES || retry.current) return;
    retry.current = setTimeout(() => {
      retry.current = null;
      setAttempt((n) => n + 1);
    }, RETRY_MS);
  };

  return (
    <video
      key={attempt}
      // A fresh query each retry so the browser doesn't reuse the empty first response.
      src={attempt ? `${src}?r=${attempt}` : src}
      muted
      autoPlay
      loop
      playsInline
      onPlaying={() => setReady(true)}
      onLoadedMetadata={(event) => {
        const { duration } = event.currentTarget;
        if (!Number.isFinite(duration) || duration < 1) scheduleRetry();
      }}
      onError={scheduleRetry}
      className={`transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}

// Resting a mouse on a short's card plays a muted preview. Touch never triggers it, and the
// trimmed clip only downloads on hover. Spread `handlers` on the card; render `video` over the cover.
export function useHoverPreview(videoUrl: string) {
  const [previewing, setPreviewing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlers = {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === "mouse") timer.current = setTimeout(() => setPreviewing(true), PREVIEW_DELAY_MS);
    },
    onPointerLeave: () => {
      if (timer.current) clearTimeout(timer.current);
      setPreviewing(false);
    },
  };

  // Unmounting the video on leave also cancels any pending retry.
  const video = previewing ? (
    <PreviewVideo src={cloudinaryVideo(videoUrl, 480, PREVIEW_CLIP)} className="absolute inset-0 h-full w-full object-cover" />
  ) : null;

  return { handlers, video };
}
