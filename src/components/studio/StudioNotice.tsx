"use client";

import { useEffect, useState } from "react";

const EVENT = "tc-studio-notice";

// A short message at the bottom of any Studio page, e.g. when something couldn't be saved.
export function studioNotice(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export function StudioNotice() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = (event: Event) => {
      setMessage((event as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 5000);
    };
    window.addEventListener(EVENT, show);
    return () => {
      window.removeEventListener(EVENT, show);
      clearTimeout(timer);
    };
  }, []);

  return (
    <p
      role="status"
      className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 border-2 border-black bg-sun px-4 py-2.5 text-sm font-bold text-ink shadow-[3px_3px_0_#000] transition-opacity lg:bottom-6 ${
        message ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {message}
    </p>
  );
}
