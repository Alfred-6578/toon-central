// Drawings from the client's "Mafiki: The Art of African Comics" guide (docs/creator-guide/mafiki), in
// its earth palette. Line work follows the text colour (currentColor) so it sits on the dark site.

export const EARTH = {
  hardwood: "#5e3820",
  terracotta: "#b9552f",
  clay: "#a67856",
  raffia: "#d6b36a",
  bronze: "#c28a2c",
  shell: "#efe3cf",
  ink: "#1c1410",
  accent: "#c8451d",
  gold: "#d99a1e",
};

const line = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
// Shapes filled with the card colour and outlined in the line colour.
const plate = { fill: "var(--color-panel)", stroke: "currentColor", strokeWidth: 3 } as const;

// The hero: a carved guardian mask on a parchment card, with a zigzag band along the bottom.
export function GuardianMask({ className = "" }: { className?: string }) {
  const card = { fill: EARTH.shell, stroke: EARTH.ink, strokeWidth: 3 } as const;
  return (
    <svg viewBox="0 0 300 380" role="img" aria-label="A stylized guardian mask with horns, slit eyes and pointed teeth" className={className}>
      <defs>
        <pattern id="mafiki-zz" width="20" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 10L5 2L10 10L15 2L20 10" fill="none" stroke={EARTH.ink} strokeWidth="2" />
        </pattern>
      </defs>
      <rect x="6" y="6" width="288" height="368" {...card} />
      <rect x="6" y="330" width="288" height="44" fill="url(#mafiki-zz)" />
      <rect x="6" y="330" width="288" height="44" {...card} fill="none" />
      <path fill={EARTH.gold} stroke={EARTH.ink} strokeWidth="3" d="M92 120C70 90 60 50 74 20C98 40 112 80 120 110ZM208 120C230 90 240 50 226 20C202 40 188 80 180 110Z" />
      <path {...card} d="M150 60C112 60 92 100 96 160C100 230 118 290 150 320C182 290 200 230 204 160C208 100 188 60 150 60Z" />
      <path fill={EARTH.accent} d="M150 64C160 90 160 130 150 160C140 130 140 90 150 64Z" />
      <path fill={EARTH.ink} d="M108 150L138 162L110 176ZM192 150L162 162L190 176Z" />
      <path {...line} stroke={EARTH.ink} d="M104 128L136 140M196 128L164 140" />
      <path fill={EARTH.ink} d="M122 236L178 236L170 252L130 252Z" />
      <path {...card} strokeWidth="2.5" d="M126 236L134 256L142 236L150 258L158 236L166 256L174 236" />
      <g {...line} stroke={EARTH.ink} strokeWidth="2.5">
        <path d="M112 190q8 8 16 0M172 190q8 8 16 0M150 168v52" />
      </g>
      <g fill={EARTH.accent}>
        <circle cx="40" cy="60" r="7" />
        <circle cx="260" cy="60" r="7" />
        <circle cx="40" cy="260" r="7" />
        <circle cx="260" cy="260" r="7" />
      </g>
    </svg>
  );
}

export type Motif =
  | "sacred" | "bridge" | "language" | "alive"
  | "horns" | "teeth" | "features" | "guardian"
  | "zigzag" | "diamonds" | "dots" | "triangles";

// The small drawings on the guide's cards.
export function MotifIcon({ motif, className = "h-12 w-auto" }: { motif: Motif; className?: string }) {
  const accent = { fill: EARTH.accent };
  const art: Record<Motif, { box: string; body: React.ReactNode }> = {
    sacred: { box: "0 0 120 70", body: <><circle {...accent} cx="60" cy="35" r="10" /><path {...line} d="M60 5v14M60 51v14M20 35h20M80 35h20" /></> },
    bridge: { box: "0 0 120 70", body: <><path {...line} d="M15 55Q60 -10 105 55" /><path {...line} d="M30 55Q60 10 90 55" /></> },
    language: { box: "0 0 120 70", body: <><path {...line} d="M10 20h100M10 35h70M10 50h90" /><circle {...accent} cx="100" cy="35" r="5" /></> },
    alive: { box: "0 0 120 70", body: <><circle {...line} cx="30" cy="35" r="12" /><circle {...line} cx="60" cy="35" r="12" /><circle {...line} cx="90" cy="35" r="12" /></> },
    horns: {
      box: "0 0 120 80",
      body: <><path fill={EARTH.gold} stroke="currentColor" strokeWidth="3" d="M30 40L22 8L48 28ZM90 40L98 8L72 28Z" /><path {...plate} d="M60 20c-24 0-32 20-26 40s16 18 26 18 20 0 26-18-2-40-26-40z" /></>,
    },
    teeth: { box: "0 0 120 80", body: <><path {...plate} d="M15 30h90v30H15z" /><path fill="currentColor" d="M20 30l8 16 8-16 8 16 8-16 8 16 8-16 8 16 8-16 8 16 8-16z" /></> },
    features: { box: "0 0 120 80", body: <><ellipse {...plate} cx="60" cy="40" rx="48" ry="22" /><path fill="currentColor" d="M24 40Q60 20 96 40Q60 58 24 40Z" /><circle {...accent} cx="60" cy="40" r="7" /></> },
    guardian: { box: "0 0 120 80", body: <><path {...line} d="M60 8L100 22v26c0 16-22 24-40 28C42 72 20 64 20 48V22Z" /><path {...accent} d="M60 24L78 32v14c0 8-10 12-18 15-8-3-18-7-18-15V32Z" /></> },
    zigzag: { box: "0 0 120 60", body: <path {...line} d="M0 45L10 15L20 45L30 15L40 45L50 15L60 45L70 15L80 45L90 15L100 45L110 15L120 45" /> },
    diamonds: { box: "0 0 120 60", body: <g {...line}><path d="M20 30L40 10L60 30L40 50Z" /><path d="M60 30L80 10L100 30L80 50Z" /></g> },
    dots: { box: "0 0 120 60", body: <><g {...accent}><circle cx="20" cy="30" r="7" /><circle cx="45" cy="30" r="7" /><circle cx="70" cy="30" r="7" /><circle cx="95" cy="30" r="7" /></g><path {...line} d="M8 50h104M8 10h104" /></> },
    triangles: { box: "0 0 120 60", body: <g {...line}><path d="M10 50L30 10L50 50ZM50 50L70 10L90 50Z" /></g> },
  };
  return (
    <svg viewBox={art[motif].box} aria-hidden="true" className={className}>
      {art[motif].body}
    </svg>
  );
}

// A band of terracotta diamonds, the guide's divider.
export function PatternStrip({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 34" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <defs>
        <pattern id="mafiki-diamond" width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M17 3L31 17L17 31L3 17Z" fill={EARTH.accent} stroke={EARTH.ink} strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="600" height="34" fill={EARTH.raffia} />
      <rect width="600" height="34" fill="url(#mafiki-diamond)" />
    </svg>
  );
}

// "Every panel wears a pattern": four panels, each with its own patterned border.
export function PatternedPanels({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 400" role="img" aria-label="A sample comic page where each panel has its own pattern border" className={className}>
      <defs>
        <pattern id="mafiki-q1" width="24" height="14" patternUnits="userSpaceOnUse"><path d="M0 12L6 2L12 12L18 2L24 12" fill="none" stroke={EARTH.hardwood} strokeWidth="2.5" /></pattern>
        <pattern id="mafiki-q2" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M11 2L20 11L11 20L2 11Z" fill={EARTH.terracotta} stroke={EARTH.hardwood} strokeWidth="1.5" /></pattern>
        <pattern id="mafiki-q3" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="4.5" fill={EARTH.bronze} stroke={EARTH.hardwood} strokeWidth="1.5" /></pattern>
        <pattern id="mafiki-q4" width="24" height="20" patternUnits="userSpaceOnUse"><path d="M2 18L12 2L22 18Z" fill={EARTH.clay} stroke={EARTH.hardwood} strokeWidth="1.5" /></pattern>
      </defs>
      <rect width="600" height="400" fill={EARTH.shell} />
      <g stroke={EARTH.ink} strokeWidth="3">
        <rect x="12" y="12" width="360" height="210" fill={EARTH.raffia} />
        <rect x="12" y="12" width="360" height="22" fill="url(#mafiki-q1)" />
        <rect x="384" y="12" width="204" height="210" fill={EARTH.clay} />
        <rect x="384" y="12" width="22" height="210" fill="url(#mafiki-q2)" />
        <rect x="12" y="234" width="204" height="154" fill={EARTH.terracotta} />
        <rect x="12" y="366" width="204" height="22" fill="url(#mafiki-q3)" />
        <rect x="228" y="234" width="360" height="154" fill={EARTH.hardwood} />
        <rect x="566" y="234" width="22" height="154" fill="url(#mafiki-q4)" />
      </g>
      <g fill={EARTH.ink} opacity=".55">
        <circle cx="190" cy="130" r="38" />
        <path d="M180 100L170 70L196 92ZM200 100L210 70L184 92Z" />
        <circle cx="486" cy="125" r="30" />
        <circle cx="114" cy="300" r="26" />
        <circle cx="410" cy="318" r="30" />
      </g>
    </svg>
  );
}
