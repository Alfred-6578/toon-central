const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export const formatCount = (n: number) => compact.format(n);

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

// Cloudinary video: resized, auto codec/quality. Pass `clip` to trim it to a silent excerpt
// (start offset and length in seconds), e.g. for hover previews.
export function cloudinaryVideo(url: string, width: number, clip?: { start: number; length: number }) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  const trim = clip ? `so_${clip.start},du_${clip.length},ac_none,` : "";
  return url.replace("/upload/", `/upload/${trim}w_${width},q_auto,vc_auto/`);
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const comicHref = (uuid: string) => `/comics/${uuid}`;
export const shortHref = (uuid: string) => `/shorts/${uuid}`;

// A series counts as active if its last episode landed within this window.
const ACTIVE_DAYS = 21;

export function isRecentlyUpdated(lastEpisodeAt: string | null) {
  if (!lastEpisodeAt) return false;
  const age = Date.now() - new Date(lastEpisodeAt.replace(" ", "T")).getTime();
  return age >= 0 && age < ACTIVE_DAYS * 86400 * 1000;
}

// "Updates Saturdays", but only for ongoing series that are actually keeping their schedule.
export function scheduleLabel(comic: { status: string; updateDays: string | null; lastEpisodeAt: string | null }) {
  if (comic.status === "COMPLETED" || !comic.updateDays || !isRecentlyUpdated(comic.lastEpisodeAt)) return null;
  return `Updates ${comic.updateDays}s`;
}
