"use client";

import { useEffect, useState } from "react";

// Images a creator uploads in the Studio preview, kept in this browser's IndexedDB (localStorage is
// too small for comic pages). Stored refs look like "idb:<key>"; ordinary URLs pass straight through.
const DB = "tc-studio";
const STORE = "images";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = fn(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const deleteStoredImage = (ref: string) =>
  ref.startsWith("idb:") ? run("readwrite", (s) => s.delete(ref.slice(4))).catch(() => undefined) : Promise.resolve();

// Stores any file as-is (e.g. a short's video).
export async function storeBlob(blob: Blob): Promise<string> {
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await run("readwrite", (s) => s.put(blob, key));
  return `idb:${key}`;
}

// Tallest piece stored in one image. Safari can't draw canvases much over ~16M pixels, and long
// webtoon strips (20,000px+) are common, so a strip is cut into parts no taller than this.
const MAX_SLICE_HEIGHT = 4000;

export class UnreadableImageError extends Error {}

const isHeic = (file: File) => /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);

// A comic page, shrunk to reader width and cut into parts if it's a tall strip. Returns one ref per part.
export async function storePageImage(file: File, maxWidth: number): Promise<string[]> {
  if (isHeic(file)) throw new UnreadableImageError("iPhone HEIC photos aren't supported: export as JPG or PNG");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new UnreadableImageError("couldn't read this file: use JPG, PNG or WebP");
  }
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const sliceSourceHeight = MAX_SLICE_HEIGHT / scale;

  const refs: string[] = [];
  for (let top = 0; top < height; top += MAX_SLICE_HEIGHT) {
    const sliceHeight = Math.min(MAX_SLICE_HEIGHT, height - top);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = sliceHeight;
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, (top / MAX_SLICE_HEIGHT) * sliceSourceHeight, bitmap.width, sliceHeight / scale, 0, 0, width, sliceHeight);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) throw new UnreadableImageError("this image is too large for the browser to process");
    refs.push(await storeBlob(blob));
  }
  bitmap.close();
  return refs;
}

// Shrinks an upload to reader size (comic pages are read on phones) and stores it.
export async function storeImage(file: File, maxWidth: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that image"))), "image/jpeg", 0.82)
  );
  return storeBlob(blob);
}

// A displayable URL for a stored ref (or the URL itself). Null while loading.
export function useImageUrl(ref: string | null | undefined) {
  const [loaded, setLoaded] = useState<{ ref: string; url: string } | null>(null);
  const direct = ref && !ref.startsWith("idb:") ? ref : null;

  useEffect(() => {
    if (!ref || !ref.startsWith("idb:")) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    run<Blob | undefined>("readonly", (s) => s.get(ref.slice(4)))
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ ref, url: objectUrl });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ref]);

  return direct ?? (loaded && loaded.ref === ref ? loaded.url : null);
}
