"use client";

import { useEffect, useRef } from "react";

// On phones the Studio sections are a sideways strip; scroll it so the current one is visible.
export function ScrollIntoStrip() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const strip = ref.current?.closest("nav");
    const current = strip?.querySelector<HTMLElement>("[aria-current=page]");
    if (strip && current) strip.scrollLeft = current.offsetLeft - strip.clientWidth / 2 + current.offsetWidth / 2;
  }, []);
  return <span ref={ref} hidden />;
}
