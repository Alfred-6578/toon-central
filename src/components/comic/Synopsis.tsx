"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Long blurbs are clamped to four lines with a toggle; short ones show no toggle at all.
export function Synopsis({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mt-5 max-w-2xl">
      <p ref={ref} className={`text-base leading-7 text-slate-200 ${expanded ? "" : "line-clamp-4"}`}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="mt-1.5 text-sm font-semibold text-mint hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
