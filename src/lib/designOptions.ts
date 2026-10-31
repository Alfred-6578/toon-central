// Design directions the client can compare. Each key is a URL param (?hero=bleed&trending=grid),
// so every combination has a shareable link. Delete an entry once the client has picked.
export const designOptions = {
  hero: {
    label: "Hero",
    defaultChoice: "panel",
    choices: { panel: "Mafiki panel", bleed: "Full bleed" },
  },
  trending: {
    label: "Trending",
    defaultChoice: "chart",
    choices: { chart: "Top 10 chart", grid: "Card grid" },
  },
  shorts: {
    label: "Shorts",
    defaultChoice: "strip",
    choices: { strip: "Film strip", plain: "Plain" },
  },
  originals: {
    label: "Originals",
    defaultChoice: "spread",
    choices: { spread: "Spotlight spread", grid: "Cover grid" },
  },
  indies: {
    label: "Indies",
    defaultChoice: "creators",
    choices: { creators: "Creator shelves", grid: "Cover grid" },
  },
  latest: {
    label: "Latest updates",
    defaultChoice: "log",
    choices: { log: "Release log", list: "List" },
  },
  genres: {
    label: "Genres",
    defaultChoice: "wall",
    choices: { wall: "Genre wall", tiles: "Tiles" },
  },
  subscribe: {
    label: "Subscribe",
    defaultChoice: "coupon",
    choices: { coupon: "Coupon", classic: "Classic" },
  },
  // First-visit welcome. Choosing one replays it (adds ?intro=1), since it otherwise shows only once.
  welcome: {
    label: "Welcome screen",
    defaultChoice: "zoom",
    choices: { page: "Mafiki page", voices: "Many voices", zoom: "Pull back", wall: "Cover wall" },
  },
  // Not a design: which creator the Studio demo shows (no creator-side data exists yet).
  studio: {
    label: "Studio demo",
    defaultChoice: "new",
    choices: { new: "New creator", established: "Established" },
  },
  // Not a design: turns on invented short→comic pairings so tie-ins can be previewed. Real by default.
  tieins: {
    label: "Short tie-ins",
    defaultChoice: "real",
    choices: { real: "Real data", demo: "Demo" },
  },
} as const;

export type DesignKey = keyof typeof designOptions;
export type DesignChoice<K extends DesignKey> = keyof (typeof designOptions)[K]["choices"];
export type DesignSelection = { [K in DesignKey]: DesignChoice<K> };

type SearchParams = Record<string, string | string[] | undefined>;

export function resolveDesign(params: SearchParams): DesignSelection {
  const pick = <K extends DesignKey>(key: K): DesignChoice<K> => {
    const value = params[key];
    const choices = designOptions[key].choices;
    return (typeof value === "string" && value in choices ? value : designOptions[key].defaultChoice) as DesignChoice<K>;
  };
  return { hero: pick("hero"), trending: pick("trending"), shorts: pick("shorts"), originals: pick("originals"), indies: pick("indies"), latest: pick("latest"), genres: pick("genres"), subscribe: pick("subscribe"), welcome: pick("welcome"), studio: pick("studio"), tieins: pick("tieins") };
}

// Link to the current selection with one option changed. Defaults are left out to keep URLs short.
export function designHref(selection: DesignSelection, key: DesignKey, choice: string, basePath = "/") {
  const next = { ...selection, [key]: choice } as Record<DesignKey, string>;
  const params = new URLSearchParams();
  (Object.keys(next) as DesignKey[]).forEach((k) => {
    if (next[k] !== designOptions[k].defaultChoice) params.set(k, next[k]);
  });
  if (key === "welcome") params.set("intro", "1");
  const query = params.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}
