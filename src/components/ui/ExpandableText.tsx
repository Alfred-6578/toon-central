"use client";

import { useLayoutEffect, useRef, useState } from "react";

type ExpandableTextProps = {
  text: string;
  // A Tailwind line-clamp class for the collapsed text, e.g. "line-clamp-3".
  clamp: string;
  className?: string;
  buttonClassName?: string;
  labels?: [more: string, less: string];
};

// Text cut to a few lines, with a toggle to read it all and fold it back. The toggle only shows when
// the text actually runs past the cut, which depends on the screen width.
export function ExpandableText({ text, clamp, className = "", buttonClassName = "", labels = ["More", "Less"] }: ExpandableTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [long, setLong] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || expanded) return;
    const measure = () => setLong(node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <>
      <p ref={ref} className={`${className} ${expanded ? "" : clamp}`}>{text}</p>
      {(long || expanded) && (
        <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className={buttonClassName}>
          {expanded ? labels[1] : labels[0]}
        </button>
      )}
    </>
  );
}
