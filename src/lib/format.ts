const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export const formatCount = (n: number) => compact.format(n);

// "1 comic", "18 comics". Comics are never called "series": Series is planned as a separate medium.
export const comicCount = (n: number) => `${n} ${n === 1 ? "comic" : "comics"}`;

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(date: string | null) {
  if (!date) return "";
  const seconds = (new Date(date.replace(" ", "T")).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

// Ask Cloudinary for a resized, auto-format/quality version of an upload.
export function cloudinary(url: string, width: number) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}

// Any Cloudinary transformation chain, e.g. "c_fill,w_720,h_960,g_north".
export function cloudinaryTransform(url: string, transform: string) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

// Square avatar crop at display size (profile photos are uploaded at full camera resolution).
// Non-Cloudinary photos (e.g. Gravatar) are returned unchanged.
export function cloudinaryAvatar(url: string, size: number) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/c_fill,g_auto,w_${size},h_${size},q_auto,f_auto/`);
}

// Cloudinary video: resized, auto codec/quality. Pass `clip` to trim it to a silent excerpt, e.g. for
// hover previews. `start` is seconds, or a percentage like "25p" (skips intros whatever the length).
export function cloudinaryVideo(url: string, width: number, clip?: { start: number | `${number}p`; length: number }) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  const trim = clip ? `so_${clip.start},du_${clip.length},ac_none,` : "";
  return url.replace("/upload/", `/upload/${trim}w_${width},q_auto,vc_auto/`);
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Clean, consistent genre URLs from the display name ("Slice of Life" → "slice-of-life",
// "Isekai/Ojemba" → "isekai-ojemba"). The API's own slugs mix cases and spaces.
export const genreSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const genreHref = (name: string) => `/genres/${genreSlug(name)}`;

// Creator URLs from the username ("Sanmi crown" → "sanmi-crown", "G.millenniumcomics" → "g-millenniumcomics").
export const creatorSlug = (username: string) =>
  username.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const creatorHref = (username: string) => `/creators/${creatorSlug(username)}`;

export const comicHref = (uuid: string) => `/comics/${uuid}`;
export const readerHref = (uuid: string, episode = 1) => `/comics/${uuid}/read/${episode}`;
export const shortHref = (uuid: string) => `/shorts/${uuid}`;

// A comic counts as active if its last episode landed within this window.
const ACTIVE_DAYS = 21;

export function isRecentlyUpdated(lastEpisodeAt: string | null) {
  if (!lastEpisodeAt) return false;
  const age = Date.now() - new Date(lastEpisodeAt.replace(" ", "T")).getTime();
  return age >= 0 && age < ACTIVE_DAYS * 86400 * 1000;
}

// "Updates Saturdays", but only for ongoing comics that are actually keeping their schedule.
export function scheduleLabel(comic: { status: string; updateDays: string | null; lastEpisodeAt: string | null }) {
  if (comic.status === "COMPLETED" || !comic.updateDays || !isRecentlyUpdated(comic.lastEpisodeAt)) return null;
  return `Updates ${comic.updateDays}s`;
}
