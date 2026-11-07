"use client";

import { ExpandableText } from "@/components/ui/ExpandableText";

// Long blurbs are clamped (three lines on phones, four up) with a toggle; short ones show no toggle at all.
export function Synopsis({ text }: { text: string }) {
  return (
    <div className="mt-4 max-w-2xl sm:mt-5">
      <ExpandableText
        text={text}
        clamp="line-clamp-3 sm:line-clamp-4"
        labels={["Read more", "Show less"]}
        className="text-[15px] leading-6 text-slate-200 sm:text-base sm:leading-7"
        buttonClassName="mt-1.5 text-sm font-semibold text-mint hover:underline"
      />
    </div>
  );
}
