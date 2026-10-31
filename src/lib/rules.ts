// Site rules shared by server and browser code (kept out of api/client.ts, which bundles the data snapshot).

// Live-site rule: the first episodes of every comic are free; later ones are locked behind a pass or plan.
export const FREE_EPISODES = 3;

// Live-site rule: a locked episode still opens with this many free pages before the paywall.
export const PREVIEW_PAGES = 5;
