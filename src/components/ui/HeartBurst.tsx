"use client";

import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { IoHeart } from "react-icons/io5";

// How long one burst lasts, start to last spark; the like button removes it after this.
export const HEART_BURST_MS = 2600;

const BIG_HEARTS = 7;
const SPARKS_PER_HEART = 5;

type Spark = { dx: number; dy: number; size: number; delay: number };
type Heart = { x: number; y: number; size: number; rotate: number; delay: number; sparks: Spark[] };

const between = (min: number, max: number) => min + Math.random() * (max - min);

// Big hearts fanned out above and beside the button, each with the little hearts it breaks into.
// `down` fans them out below instead, for buttons with no room above (the reader's top bar).
function layout(down: boolean): Heart[] {
  const flip = down ? -1 : 1;
  return Array.from({ length: BIG_HEARTS }, (_, i) => {
    // From left (-160°) round the top to right (-20°), evenly with a little jitter.
    const angle = ((-160 + (140 * i) / (BIG_HEARTS - 1) + between(-8, 8)) * Math.PI) / 180;
    const distance = between(52, 120);
    return {
      x: Math.cos(angle) * distance,
      y: (Math.sin(angle) * distance * 0.9 + between(-6, 14)) * flip,
      size: between(36, 76),
      rotate: between(-18, 18),
      delay: between(0, 140),
      sparks: Array.from({ length: SPARKS_PER_HEART }, () => {
        const a = between(-170, -10) * (Math.PI / 180);
        const d = between(26, 70);
        return { dx: Math.cos(a) * d, dy: (Math.sin(a) * d - between(10, 30)) * (down ? -0.6 : 1), size: between(7, 14), delay: between(0, 160) };
      }),
    };
  });
}

// The client's sticker-style like: big green hearts pop out around the button, hang there a moment, then
// shatter into small hearts that drift up and fade. Drawn over the page at (x, y) in viewport pixels.
export function HeartBurst({ x, y }: { x: number; y: number }) {
  const [hearts] = useState(() => layout(y < 180));

  return createPortal(
    <div className="pointer-events-none fixed z-[120]" style={{ left: x, top: y }} aria-hidden="true">
      {hearts.map((heart, i) => (
        <div key={i}>
          <IoHeart
            className="like-heart absolute text-mint drop-shadow-[2px_2px_0_#000]"
            style={
              {
                "--x": `${heart.x}px`,
                "--y": `${heart.y}px`,
                "--r": `${heart.rotate}deg`,
                width: heart.size,
                height: heart.size,
                animationDelay: `${heart.delay}ms`,
              } as CSSProperties
            }
          />
          {heart.sparks.map((spark, j) => (
            <IoHeart
              key={j}
              className="like-spark absolute text-mint"
              style={
                {
                  "--x": `${heart.x}px`,
                  "--y": `${heart.y}px`,
                  "--dx": `${spark.dx}px`,
                  "--dy": `${spark.dy}px`,
                  width: spark.size,
                  height: spark.size,
                  animationDelay: `${heart.delay + 1150 + spark.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>,
    document.body
  );
}
