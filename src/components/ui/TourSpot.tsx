import type { ReactNode } from "react";

const PAD = 6;
const CARD_GAP = 14;

type Props = {
  // The control being pointed at, in viewport pixels; null docks the card in the corner.
  rect: DOMRect | null;
  // Reader guide: dims the page and blocks it (a click outside ends the guide). Creator tutorial: the
  // page stays usable, so they can fill in the form the step is about.
  blocking?: boolean;
  onBackdrop?: () => void;
  labelledBy: string;
  children: ReactNode;
};

export const findTourTarget = (target: string) => {
  const rect = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)?.getBoundingClientRect();
  return rect && rect.width > 0 && rect.height > 0 ? rect : null;
};

// A guided-tour step: a mint ring round the control and a speech-bubble card beside it (below when
// there's room, else above, kept on screen). Controls too tall to sit beside, or none at all, get the
// card docked bottom-right instead (above the phone tab bar).
export function TourSpot({ rect, blocking = false, onBackdrop, labelledBy, children }: Props) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardWidth = Math.min(340, vw - 32);
  const anchored = rect !== null && rect.height < vh * 0.5;
  const below = anchored && rect.bottom + 230 < vh;
  const left = anchored ? Math.min(Math.max(rect.left + rect.width / 2 - cardWidth / 2, 16), vw - cardWidth - 16) : 0;
  const tailLeft = anchored ? Math.min(Math.max(rect.left + rect.width / 2 - left - 10, 18), cardWidth - 38) : 0;

  return (
    <div
      role="dialog"
      aria-modal={blocking}
      aria-labelledby={labelledBy}
      className={`fixed inset-0 z-[60] ${blocking ? "" : "pointer-events-none"}`}
    >
      {blocking && <div className="absolute inset-0" onClick={onBackdrop} aria-hidden="true" />}

      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute border-[3px] border-mint transition-all duration-300"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: `0 0 0 3px #000, 0 0 0 200vmax rgba(7, 11, 20, ${blocking ? 0.8 : 0.45})`,
          }}
        />
      )}

      <div
        className="pointer-events-auto absolute border-[3px] border-black bg-paper p-5 text-ink shadow-[5px_5px_0_#000] transition-all duration-300"
        style={{
          width: cardWidth,
          ...(anchored
            ? { left, ...(below ? { top: rect.bottom + PAD + CARD_GAP } : { bottom: vh - rect.top + PAD + CARD_GAP }) }
            : { right: 16, bottom: vw < 1024 ? 96 : 16 }),
        }}
      >
        {anchored && (
          // Speech-bubble tail pointing at the control.
          <span
            aria-hidden="true"
            className={`absolute h-5 w-5 rotate-45 border-black bg-paper ${below ? "-top-[11px] border-l-[3px] border-t-[3px]" : "-bottom-[11px] border-b-[3px] border-r-[3px]"}`}
            style={{ left: tailLeft }}
          />
        )}
        {children}
      </div>
    </div>
  );
}
