"use client";

import { cloudinary } from "@/lib/format";
import { useImageUrl } from "@/lib/imageStore";

// Shows a Studio image ref: an upload kept in this browser, or a real Cloudinary URL. Halftone while loading.
export function StudioImage({ src, width = 300, className = "", alt = "" }: { src: string | null; width?: number; className?: string; alt?: string }) {
  const url = useImageUrl(src);
  const shown = url && url.startsWith("http") ? cloudinary(url, width) : url;
  return (
    <span className={`halftone-sweep block overflow-hidden ${className}`}>
      {shown && <img src={shown} alt={alt} className="h-full w-full object-cover" />}
    </span>
  );
}
