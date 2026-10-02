// Design directions the client can compare. Each key is a URL param (?hero=bleed&trending=grid),
// so every combination has a shareable link. Delete an entry once the client has picked.
export const designOptions = {
  hero: {
    label: "Hero",
    defaultChoice: "panel",
    choices: { panel: "Comic panel", bleed: "Full bleed" },
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
  return { hero: pick("hero"), trending: pick("trending"), shorts: pick("shorts"), originals: pick("originals"), indies: pick("indies"), latest: pick("latest"), genres: pick("genres"), subscribe: pick("subscribe") };
}

// Link to the current selection with one option changed.
export function designHref(selection: DesignSelection, key: DesignKey, choice: string) {
  const params = new URLSearchParams({ ...selection, [key]: choice } as Record<string, string>);
  return `/?${params.toString()}`;
}
