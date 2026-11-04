// Views for shorts: counted once a short has played for a few seconds, and only once per short per
// page load, so scrolling back past it doesn't count it again.
const counted = new Set<string>();

// How long a short must play to count: 3 seconds, or half of it if it's shorter than that allows.
export const viewAfter = (duration: number) => Math.min(3, (Number.isFinite(duration) && duration > 0 ? duration : 6) / 2);

export function countShortView(uuid: string) {
  if (counted.has(uuid)) return;
  counted.add(uuid);
  // keepalive: still sent if the reader leaves the page right away.
  fetch(`/api/shorts/${uuid}/view`, { method: "POST", keepalive: true }).catch(() => counted.delete(uuid));
}
