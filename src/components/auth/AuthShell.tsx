import type { ReactNode } from "react";
import type { Comic } from "@/lib/api/types";
import { cloudinary } from "@/lib/format";

// Panel shapes for the art side: a comic page of four covers, one wide panel across the bottom.
const PANELS = ["col-span-1 row-span-2", "col-span-1", "col-span-1", "col-span-2"];

type AuthShellProps = { covers: Comic[]; bubble: string; children: ReactNode };

// Shared frame for the /auth pages: the form on the right; on desktop, a comic page of real covers
// on the left with a speech bubble that changes per page.
export function AuthShell({ covers, bubble, children }: AuthShellProps) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start lg:gap-14 lg:px-10 lg:pt-14">
      <div className="relative hidden lg:block" aria-hidden="true">
        <div className="grid h-[34rem] grid-cols-2 grid-rows-3 gap-2.5 border-[3px] border-black bg-paper p-2.5 shadow-[8px_8px_0_#000]">
          {covers.slice(0, PANELS.length).map((comic, i) => (
            <div key={comic.uuid} className={`overflow-hidden border-[3px] border-black bg-ink ${PANELS[i]}`}>
              <img src={cloudinary(comic.coverImage, 520)} alt="" className="h-full w-full object-cover object-[50%_25%]" />
            </div>
          ))}
        </div>
        {/* Speech bubble with a tail, poking out of the page's top-right corner. */}
        <div className="absolute -right-6 -top-6 max-w-[15rem] rotate-2 border-[3px] border-black bg-white px-5 py-4 text-ink shadow-[4px_4px_0_#000]">
          <p className="font-display text-2xl uppercase leading-none">{bubble}</p>
          <span className="absolute -bottom-[13px] left-8 h-5 w-5 rotate-45 border-b-[3px] border-r-[3px] border-black bg-white" />
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
