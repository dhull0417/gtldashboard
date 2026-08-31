export const RANGE_DAYS = { "1d": 1, "7d": 7, "30d": 30, "3m": 90, "1y": 365, all: Infinity };
export const RANGES = Object.keys(RANGE_DAYS);
export const METRICS = [
  { key: "users", label: "New users", color: "var(--series-users)" },
  { key: "groups", label: "New groups", color: "var(--series-groups)" },
  { key: "meetups", label: "New meetups", color: "var(--series-meetups)" },
];

export function filterByRange(days, range) {
  const n = RANGE_DAYS[range];
  if (!Number.isFinite(n)) return days;
  return days.slice(-n);
}

export function previousRangeDays(days, range) {
  const n = RANGE_DAYS[range];
  if (!Number.isFinite(n)) return [];
  // Compares against whatever history exists before the current window, even if
  // that's fewer than n days (e.g. early on, before a full prior period has
  // accumulated) — so the delta badge works from day one instead of needing
  // 2x the range's worth of history before it can show anything.
  const windowStart = Math.max(days.length - n, 0);
  return days.slice(Math.max(windowStart - n, 0), windowStart);
}

export function niceMax(max) {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = Math.ceil(max / magnitude);
  return step * magnitude;
}
